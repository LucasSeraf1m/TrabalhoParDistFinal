const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const regression = require('regression');

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const server = new grpc.Server();

// Adiciona os serviços definidos no .proto ao servidor gRPC
server.addService(leiFuncaoPackage.LeiFuncao.service, {
  encontraFuncao: encontraFuncao,
  readFuncaoStream: readFuncaoStream,
});

// Liga o servidor na porta 40000
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error("Server binding error:", error);
    return;
  }
  console.log("Server running at http://0.0.0.0:" + port);
  server;
});

const funcoes = []; // Array para armazenar os todos

// Implementa o método encontralaLei
function encontraFuncao(call, callback) {
  const tipoFuncao = call.request.tipo;
  const arrayX = call.request.x.split(',').map(Number);
  const arrayY = call.request.y.split(',').map(Number);

  console.log(tipoFuncao);

  const pontos = arrayX.map((x, i) => [x, arrayY[i]]);

  console.log(pontos);

  let resultado;

  if (tipoFuncao === 'log') {
    resultado = regression.logarithmic(pontos);    
  } else if (tipoFuncao === 'exp') {
    resultado = regression.exponential(pontos);
  } 

  const FuncaoAjuste = {
    funcaoAjuste: resultado.string
  };

  funcoes.push(FuncaoAjuste); // Adiciona a nova FuncaoAjuste à lista
  callback(null, FuncaoAjuste); // Retorna a FuncaoAjuste criada
}

// Implementa o método readTodosStream
function readFuncaoStream(call) {
  funcoes.forEach((funcao) => call.write(funcao)); // Envia cada FuncaoAjuste no fluxo
  call.end(); // Finaliza o fluxo
}