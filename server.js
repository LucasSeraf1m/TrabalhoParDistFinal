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
  encontralaLei: encontralaLei,
  readCoeficientesStream: readCoeficientesStream,
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

const todos = []; // Array para armazenar os todos

// Implementa o método encontralaLei
function encontralaLei(call, callback) {
  const arrayX = call.request.x.split(',').map(Number);
  const arrayY = call.request.y.split(',').map(Number);

  const pontos = arrayX.map((x, i) => [x, arrayY[i]]);

  const resultado = regression.exponential(pontos);

  console.log(resultado.equation);

  const Coeficientes = {
    coeficientes: resultado.equation
  };

  todos.push(Coeficientes); // Adiciona o novo todo à lista
  callback(null, Coeficientes); // Retorna o todo criado
}

// Implementa o método readTodosStream
function readCoeficientesStream(call) {
  todos.forEach((t) => call.write(t)); // Envia cada todo no fluxo
  call.end(); // Finaliza o fluxo
}