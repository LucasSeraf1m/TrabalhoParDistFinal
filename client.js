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

const callTabela = client.readTabelaStream();

let lastItemTabela = null;

callTabela.on("data", (item) => {
  lastItemTabela = item;
});

callTabela.on("end", () => {
  if (lastItemTabela) {
    if (tipoFuncao === 'log') {
      console.log(lastItemTabela.tabela);
    } else if (tipoFuncao === 'exp') {
      console.log(lastItemTabela.tabela);
    } 
  }
});

callTabela.on("error", (e) => console.error("Erro na transmissão de tabela:", e));

const callFuncao = client.readFuncaoStream();

let lastItemFuncao = null;

callFuncao.on("data", (item) => {
  lastItemFuncao = item;
});

callFuncao.on("end", () => {
  if (lastItemFuncao) {
    if (tipoFuncao === 'log') {
      console.log("Função logarítmica de ajuste da curva:", lastItemFuncao.funcaoAjuste);
    } else if (tipoFuncao === 'exp') {
      console.log("Função exponencial de ajuste da curva:", lastItemFuncao.funcaoAjuste);
    } 
  }
});

callFuncao.on("error", (e) => console.error("Streaming error:", e));