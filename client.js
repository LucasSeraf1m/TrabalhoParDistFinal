const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const x = process.argv[2]; // Texto do todo passado como argumento (segundo argumento da command line)
const y = process.argv[3];

const client = new leiFuncaoPackage.LeiFuncao(
  "localhost:40000",
  grpc.credentials.createInsecure()
);

// Chama o método encontralaLei no servidor
client.encontralaLei(
  {
    x: x,
    y: y
  },
  (err, response) => {
    if (err) {
      console.error("Error creating todo:", err);
    }
  }
);

// Chama o método readFuncaoAjusteStream no servidor
const call = client.readFuncaoAjusteStream();

// Registra callback para quando o servidor envia um item de todo
call.on("data", (item) => {
  // console.log("Recebeu item do servidor:", JSON.stringify(item));
  // console.log("Função de ajuste da curva: y =", item.coeficientes[0], "* e ^", item.coeficientes[1]);
  console.log("Função de ajuste da curva: ", item.funcaoAjuste);
});

// Registra callback para quando o servidor termina de enviar todos os todos
call.on("end", () => console.log("Servidor pronto!"));
call.on("error", (e) => console.error("Streaming error:", e));
