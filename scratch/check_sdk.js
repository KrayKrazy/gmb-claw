import * as genai from '@google/genai';

console.log("Exports de @google/genai:");
console.log(Object.keys(genai));

try {
    const client = new genai.GoogleGenAI("test");
    console.log("Métodos do client:");
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
} catch (e) {
    console.log("Erro ao instanciar GoogleGenAI:", e.message);
}

try {
    const client2 = new genai.GenAI({ apiKey: "test" });
    console.log("Métodos do GenAI:");
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client2)));
} catch (e) {
    console.log("Erro ao instanciar GenAI:", e.message);
}
