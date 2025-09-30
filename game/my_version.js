const readlineSync = require('readline-sync');

class hero{
    constructor(name, XP, uron) {
        this.name = name;
        this.XP = XP;
        this.uron = uron;
    }

    haveUron(pisdyla){
        this.XP - pisdyla
    }
}

let heros = {}

while(true){
    let value = readlineSync.question("?:")

    if(value == "1"){
        let name = readlineSync.question("name:")
        let XP = parseInt(readlineSync.question("XP :"))
        let uron = parseInt(readlineSync.question("uron:"))
        heros[name] = new hero(name, XP, uron)
    }

    console.log(heros)

    if(value == "2"){
        let name2 = readlineSync.question()

        if(name2 == heros[name2]){
            let value2 = readlineSync.question("?2:")
            if(value2 == "XP"){
                console.log(heros[name2])
                let newXp = parseInt(readlineSync.question("new XP:"))
                //heros[name2]
            }
        }
    }
}