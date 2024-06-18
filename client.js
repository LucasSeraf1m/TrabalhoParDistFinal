const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Carrega o arquivo .proto
const packageDef = protoLoader.loadSync("./lei_funcao.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const leiFuncaoPackage = grpcObject.leiFuncaoPackage;

const tipoFuncao = process.argv[2];
const x = process.argv[3];
const y = process.argv[4];

const client = new leiFuncaoPackage.LeiFuncao(
  "localhost:40000",
  grpc.credentials.createInsecure()
);

client.encontraFuncao(
  {
    tipo: tipoFuncao,
    x: x,
    y: y,
  },
  (err, response) => {
    if (err) {
      console.error("Error creating todo:", err);
    } else {
      console.log(response.funcaoAjuste);
      console.log(`Graph available at: ${response.linkToGraph}`);
    }
  }
);

const callTabela = client.readTabelaStream();
let lastItemTabela = null;

callTabela.on("data", (item) => {
  lastItemTabela = item;
});

callTabela.on("end", () => {
  if (lastItemTabela) {
    console.log(lastItemTabela.tabela);
  }
});

callTabela.on("error", (e) =>
  console.error("Erro na transmissão de tabela:", e)
);

const callFuncao = client.readFuncaoStream();
let lastItemFuncao = null;

callFuncao.on("data", (item) => {
  lastItemFuncao = item;
});

callFuncao.on("end", () => {
  if (lastItemFuncao) {
    console.log(lastItemFuncao.funcaoAjuste);
  }
});

callFuncao.on("error", (e) => console.error("Streaming error:", e));
