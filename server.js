const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const todoPackage = grpcObject.todoPackage;

const server = new grpc.Server();

// Adiciona os serviços definidos no .proto ao servidor gRPC
server.addService(todoPackage.Todo.service, {
  createTodo: createTodo,
  readTodosStream: readTodosStream,
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

// Implementa o método createTodo
function createTodo(call, callback) {
  const todoItem = {
    id: todos.length + 1,
    text: call.request.text,
  };
  todos.push(todoItem); // Adiciona o novo todo à lista
  callback(null, todoItem); // Retorna o todo criado
}

// Implementa o método readTodosStream
function readTodosStream(call) {
  todos.forEach((t) => call.write(t)); // Envia cada todo no fluxo
  call.end(); // Finaliza o fluxo
}