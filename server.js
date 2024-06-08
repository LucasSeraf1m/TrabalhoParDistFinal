const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const regression = require("regression");
const express = require("express");
const path = require("path");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const server = new grpc.Server();
const app = express();

// Adiciona os serviços definidos no .proto ao servidor gRPC
server.addService(leiFuncaoPackage.LeiFuncao.service, {
  encontraFuncao: encontraFuncao,
  readFuncaoStream: readFuncaoStream,
  readTabelaStream: readTabelaStream,
});

// Liga o servidor na porta 40000
server.bindAsync(
  "0.0.0.0:40000",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Server binding error:", error);
      return;
    }
    console.log("Server running at http://0.0.0.0:" + port);
    server;
  }
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/data", (req, res) => {
  const tipoFuncao = req.query.tipo;
  const x = req.query.x;
  const y = req.query.y;

  client.encontraFuncao({ tipo: tipoFuncao, x: x, y: y }, (err, response) => {
    if (err) {
      res.status(500).send("Error retrieving data");
      return;
    }
    const arrayX = x.split(",").map(Number);
    const arrayY = y.split(",").map(Number);
    const pontos = arrayX.map((x, i) => [x, arrayY[i]]);

    res.json({
      funcaoAjuste: response.funcaoAjuste,
      pontos: pontos,
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});

const funcoes = [];
const tabelas = [];

function processarPontosExp(pontos) {
  const dados = pontos.map(([x, y]) => {
    const lnY = Math.log(y);
    const xLnY = x * lnY;
    const x2 = x * x;
    return { x, lnY, xLnY, x2 };
  });

  return dados;
}

function gerarTabelaExp(dados) {
  // Adiciona o cabeçalho da tabela
  let tabela = "  x |  ln(y) | x*ln(y) | x^2 \n";
  tabela += "----|--------|---------|-------\n";

  // Adiciona as linhas de dados
  dados.forEach((linha) => {
    tabela += `${linha.x.toString().padStart(3)} | ${linha.lnY
      .toFixed(3)
      .padStart(6)} | ${linha.xLnY.toFixed(3).padStart(7)} | ${linha.x2
      .toString()
      .padStart(4)}\n`;
  });

  // Calcula os somatórios
  const somaX = dados.reduce((acc, curr) => acc + curr.x, 0);
  const somaLnY = dados.reduce((acc, curr) => acc + curr.lnY, 0);
  const somaXLnY = dados.reduce((acc, curr) => acc + curr.xLnY, 0);
  const somaX2 = dados.reduce((acc, curr) => acc + curr.x2, 0);

  // Adiciona os somatórios
  tabela += "----|--------|---------|-------\n";
  tabela += `${somaX.toString().padStart(3)} | ${somaLnY
    .toFixed(3)
    .padStart(6)} | ${somaXLnY.toFixed(3).padStart(7)} | ${somaX2
    .toString()
    .padStart(4)}\n`;

  return tabela;
}

function processarPontosLog(pontos) {
  const dados = pontos.map(([x, y]) => {
    const lnX = Math.log(x);
    const yLnX = y * lnX;
    const lnX2 = lnX * lnX;
    return { lnX, y, yLnX, lnX2 };
  });

  return dados;
}

function gerarTabelaLog(dados) {
  // Adiciona o cabeçalho da tabela
  let tabela = "  ln(x) |    y   | y*ln(x) | ln(x)^2 \n";
  tabela += "--------|--------|---------|----------\n";

  // Adiciona as linhas de dados
  dados.forEach((linha) => {
    tabela += `${linha.lnX.toFixed(3).padStart(7)} | ${linha.y
      .toFixed(3)
      .padStart(6)} | ${linha.yLnX.toFixed(3).padStart(7)} | ${linha.lnX2
      .toFixed(3)
      .padStart(7)}\n`;
  });

  // Calcula os somatórios
  const somaLnX = dados.reduce((acc, curr) => acc + curr.lnX, 0);
  const somaY = dados.reduce((acc, curr) => acc + curr.y, 0);
  const somaYlnX = dados.reduce((acc, curr) => acc + curr.yLnX, 0);
  const somaLnX2 = dados.reduce((acc, curr) => acc + curr.lnX2, 0);

  // Adiciona os somatórios
  tabela += "--------|--------|---------|----------\n";
  tabela += `${somaLnX.toFixed(3).padStart(7)} | ${somaY
    .toFixed(3)
    .padStart(6)} | ${somaYlnX.toFixed(3).padStart(7)} | ${somaLnX2
    .toFixed(3)
    .padStart(7)}\n`;

  return tabela;
}

function encontraFuncao(call) {
  const tipoFuncao = call.request.tipo;
  const arrayX = call.request.x.split(",").map(Number);
  const arrayY = call.request.y.split(",").map(Number);

  const pontos = arrayX.map((x, i) => [x, arrayY[i]]);

  let resultado;
  let dados;
  let tabela;

  if (tipoFuncao === "log") {
    dados = processarPontosLog(pontos);
    tabela = gerarTabelaLog(dados);
    resultado = regression.logarithmic(pontos);
  } else if (tipoFuncao === "exp") {
    dados = processarPontosExp(pontos);
    tabela = gerarTabelaExp(dados);
    resultado = regression.exponential(pontos);
  }

  const FuncaoAjuste = {
    funcaoAjuste: resultado.string,
  };

  const Tabela = {
    tabela: tabela,
  };

  return FuncaoAjuste, Tabela;
}

function alimentaVetores() {
  

  funcoes.push(FuncaoAjuste);
  tabelas.push(Tabela);
}

function readFuncaoStream(callFuncao) {
  funcoes.forEach((funcao) => callFuncao.write(funcao));
  callFuncao.end(); // Finaliza o fluxo
}

function readTabelaStream(callTabela) {
  tabelas.forEach((tabela) => callTabela.write(tabela));
  callTabela.end();
}
