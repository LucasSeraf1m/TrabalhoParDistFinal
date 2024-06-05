const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const regression = require("regression");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const server = new grpc.Server();

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
  tabela += "----|--------|---------|-----\n";

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
  tabela += "----|--------|---------|-----\n";
  tabela += `${somaX.toString().padStart(3)} | ${somaLnY
    .toFixed(3)
    .padStart(6)} | ${somaXLnY.toFixed(3).padStart(7)} | ${somaX2
    .toString()
    .padStart(4)}\n`;

  return tabela;
}

function encontraFuncao(call, callback) {
  const tipoFuncao = call.request.tipo;
  const arrayX = call.request.x.split(",").map(Number);
  const arrayY = call.request.y.split(",").map(Number);

  const pontos = arrayX.map((x, i) => [x, arrayY[i]]);

  let resultado;
  let dados;
  let tabela;

  if (tipoFuncao === "log") {
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

  funcoes.push(FuncaoAjuste);
  tabelas.push(Tabela);
  callback(null, FuncaoAjuste); // Retorna a FuncaoAjuste criada
}

function readFuncaoStream(callFuncao) {
  funcoes.forEach((funcao) => callFuncao.write(funcao));
  callFuncao.end(); // Finaliza o fluxo
}

function readTabelaStream(callTabela) {
  tabelas.forEach((tabela) => callTabela.write(tabela));
  callTabela.end();
}
