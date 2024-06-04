const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const todoPackage = grpcObject.todoPackage;

const text = process.argv[2]; // Texto do todo passado como argumento

const client = new todoPackage.Todo(
  "localhost:40000",
  grpc.credentials.createInsecure()
);

// Chama o método createTodo no servidor
client.createTodo(
  {
    id: -1,
    text: text,
  },
  (err, response) => {
    if (err) {
      console.error("Error creating todo:", err);
    } else {
      console.log("Received from server:", JSON.stringify(response));
    }
  }
);

// Chama o método readTodosStream no servidor
const call = client.readTodosStream();
call.on("data", (item) => {
  console.log("Received item from server:", JSON.stringify(item));
});

call.on("end", () => console.log("Server done!"));
call.on("error", (e) => console.error("Streaming error:", e));
