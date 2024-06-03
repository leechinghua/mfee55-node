// CJS 匯入
const Person = require("./Person.cjs");
// 已經匯入的資源就不會再執行裡面的內容, (快取)
const Person2 = require("./Person.cjs");

const p2 = new Person("Flora", 23);
const p3 = new Person2("Alex", 22);

console.log(p2);
console.log(p3);
console.log(Person===Person2);
