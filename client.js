const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const tipoFuncao = process.argv[2];
const x = process.argv[3]; // Texto do todo passado como argumento (segundo argumento da command line)
const y = process.argv[4];

const client = new leiFuncaoPackage.LeiFuncao(
  "localhost:40000",
  grpc.credentials.createInsecure()
);

// Chama o método encontralaLei no servidor
client.encontraFuncao(
  {
    tipo: tipoFuncao,
    x: x,
    y: y
  },
  (err, response) => {
    if (err) {
      console.error("Error creating todo:", err);
    }
  }
);

// Chama o método readFuncaoStream no servidor
const call = client.readFuncaoStream();

let lastItem = null;

// Registra callback para quando o servidor envia um item de todo
call.on("data", (item) => {
  lastItem = item;
});

call.on("end", () => {
  if (lastItem) {
    if (tipoFuncao === 'log') {
      console.log("Função logarítmica de ajuste da curva:", lastItem.funcaoAjuste);
    } else if (tipoFuncao === 'exp') {
      console.log("Função exponencial de ajuste da curva:", lastItem.funcaoAjuste);
    } 
  }
  console.log("Servidor pronto!");
});

call.on("error", (e) => console.error("Streaming error:", e));
