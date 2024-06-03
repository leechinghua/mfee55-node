class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  toString() {
    return JSON.stringify(this);
  }
}
const p1 = new Person("John", 25);
console.log(p1);
console.log(p1 + '');


