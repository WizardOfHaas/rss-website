(function(window, $, undefined) {
    'use strict';

    function DOPE(config){
        this.config = config;

        this.vars = {
            "E": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "F": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "G": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "H": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
    
        this.ops = {
            "+": {
                checks: ["csv", "csv", "sv"],
                run: function(args, mask){ //Add
                    var a = this.getValue(args[0], mask[0]);
                    var b = this.getValue(args[1], mask[1]);
    
                    this.setValue(args[2], mask[2], a + b);
                }
            },
            "-": {
                checks: ["csv", "csv", "sv"],
                run: function(args, mask){ //Subtract
                    var a = this.getValue(args[0], mask[0]);
                    var b = this.getValue(args[1], mask[1]);
    
                    this.setValue(args[2], mask[2], a - b);
                }
            },
            ".": {
                checks: ["csv", "csv", "sv"],
                run: function(args, mask){ //Multiply
                    var a = this.getValue(args[0], mask[0]);
                    var b = this.getValue(args[1], mask[1]);
    
                    this.setValue(args[2], mask[2], a * b);
                }
            },
            "/": {
                checks: ["csv", "csv", "sv"],
                run: function(args, mask){ //Divide
                    var a = this.getValue(args[0], mask[0]);
                    var b = this.getValue(args[1], mask[1]);
    
                    this.setValue(args[2], mask[2], a / b);
                }
            },
            ";": {
                checks: ["csv", "sv"],
                run: function(args, mask){ //Set value
                    var a = this.getValue(args[0], mask[0]);
                    this.setValue(args[1], mask[1], a);
                }
            },
            "SQR": {
                checks: ["csv", "sv"],
                run: function(args, mask){
                    var a = this.getValue(args[0], mask[0]);
                    this.setValue(args[1], mask[1], Math.sqrt(a));	
                }
            },
            "EXP": {
                checks: ["csv", "sv"],
                run: function(args, mask){
                    var a = this.getValue(args[0], mask[0]);
                    this.setValue(args[1], mask[1], Math.exp(a));	
                }
            },
            "LOG": {
                checks: ["csv", "sv"],
                run: function(args, mask){
                    var a = this.getValue(args[0], mask[0]);
                    this.setValue(args[1], mask[1], Math.log(a));
                }
            },
            "SIN": {
                checks: ["csv", "sv"],
                run: function(args, mask){
                    var a = this.getValue(args[0], mask[0]);
                    this.setValue(args[1], mask[1], Math.sin(a));	
                }
            },
            "C": {
                checks: ["csv", "csv", "csv", "csv", "csv"],
                run: function(args, mask){ //Conditional jump
                    var a = this.getValue(args[0], mask[0]);
                    var b = this.getValue(args[1], mask[1]);
    
                    var l1 = this.getValue(args[2], mask[2]);
                    var l2 = this.getValue(args[3], mask[3]);
                    var l3 = this.getValue(args[4], mask[4]);
    
                    if(a > b){
                        return l1;
                    }else if(a == b){
                        return l2;
                    }else if(a < b){
                        return l3;
                    }
                }
            },
            "T": {
                checks: ["csv"],
                run: function(args, mask){ //jump To line
                    var a = this.getValue(args[0], mask[0]);
                    return a;
                }
            },
            "P": {
                checks: ["csv"],
                run: function(args, mask){ //Print value
                    var a = this.getValue(args[0], mask[0]);
                    this.output(a + " ");
                }
            },
            "A": {
                checks: ["l"],
                run: function(args, mask){ //Print label, aka string literal
                    var a = this.getValue(args[0], mask[0]);
                    this.output(a);
                }
            },
            "N": {
                checks: [],
                run: function(args, mask){ //Print newline
                    this.output("\r\n");
                }
            },
            "J": {
                checks: ["sv"],
                run: function(args, mask){ //Take keyboard input => var
                    /*
                    term.write(" -->> ");
                    input();
                    setValue(args[0], mask[0], parseFloat(buffer));
                    */
    
                    var n = prompt("Input A Number");
                    this.setValue(args[0], mask[0], parseFloat(n));
                }
            },
            "Z": {
                checks: ["sv", "csv", "csv"],
                run: function(args, mask, num){ //Attempt at simple for loop
                    var a = args[0];
                    var b = this.getValue(args[1], mask[1]);
                    var c = this.getValue(args[2], mask[2]);
    
                    if(this.loops.length == 0 || this.loops[this.loops.length - 1] != num){ //Is this loop new?
                        this.setValue(a, mask[0], b); //Set out iterator to the initial value
                        this.loops.push(num); //Save over the line number of the loop
                    }else if(this.vars[a] >= c){
                        this.loops.pop(); //Remove us from the loop list

                        //Find closest E to jump after...
                        var e = this.lines.findIndex(function(l, i){return l && l.match(/^E/) && i > num});

                        return e + 1;
                    }else{ //We are iterating
                        this.setValue(a, mask[0], this.getValue(a, mask[0]) + 1); //We can only go up, them's the rules
                    }
                }
            },
            "E": {
                checks: [],
                run: function(args, mask){ //End of loop block
                    console.log(this.loops);

                    if(this.loops.length > 0){
                        return this.loops[this.loops.length - 1];
                    }
                }
            }
        };
    
        this.maskNames = {
            "l": "LABEL",
            "c": "CONSTANT",
            "s": "SCALAR",
            "v": "VECTOR"
        };
    
        this.lines = [];
        this.loops = [];
        this.sep = "'"; //Token seporator, will eventually switch to '

        return this;
    }

    DOPE.prototype.run = async function(buffer){
        var self = this;

        this.parseBuffer(buffer);

        var n = 1;

        while(this.lines[n] != "F" && n < this.lines.length){ //Run until FINAL or no more lines
            console.log("Running Line: " + n);

            var next = this.runLine(n, this.lines[n]);
                
            if(next == -1){
                break;
            }

            n = next;

            await new Promise(done => setTimeout(() => done(), 50));
        }

        return;
    };

    DOPE.prototype.parseBuffer = function(buffer){
        var self = this;

        var code = buffer.split("\n").map(function(l){
            return l.replace(/^\s*/, "");
        });

        this.lines = [];

        code.forEach(function(l){
            var ts = l.split(self.sep);
            self.lines[ts.shift()] = ts.join(self.sep);
        });

        return this.lines;
    }

    DOPE.prototype.runLine = function(num, line){
        //Split to tokens, should be by ' but using space for now
        var t = line.split(this.sep);
        var op = t.shift();

        if(this.ops[op]){ //Is this a valid operation?
            //Lets make a mask...
            var mask = this.makeMask(t);

            //Do syntax check here!
            var checks = this.ops[op].checks;

            //Do we have the right number of args?
            if(t.length != checks.length){
                this.error(op + " ACCEPTS " + checks.length + " ARGS", num);
                return -1;
            }

            //Do we have the right kind of args?
            for(var i = 0; i < checks.length; i++){
                var regex = new RegExp("^[" + checks[i] + "]$");

                if(!mask[i].match(regex)){
                    this.error("ARG " + (i + 1) + " TO " + op + " CANNOT BE A " + this.maskNames[mask[i]], num);
                    return -1;
                }
            }

            var nextLine = this.ops[op].run.call(this, t, mask, num);

            if(!nextLine || typeof nextLine !== "number"){
                nextLine = num + 1;

                //Deal with non-continous line numbers... :(
            }else{
                console.log("Jumping to: " + nextLine);
            }

            return nextLine;
        }else{
            //Throw an error
            this.error();
        }
    };

    DOPE.prototype.getValue = function(token, mask){
        if(mask == "c"){ //Deal with const value
            return parseFloat(token);
        }else if(mask == "s"){ //Grab a scalar var
            return this.vars[token];
        }else if(mask == "v"){ //Grab a vector... kinda gross...
            var [t, i] = token.split(/[\[\]]/);

            var iMask = this.makeMask([i])[0];
            if(iMask == "s"){
                i = this.getValue(i, iMask);
            }

            return this.vars[t][i];
        }else if(mask == "l"){
            return token;
        }
    }

    DOPE.prototype.setValue = function(token, mask, val){
        if(mask == "s"){ //Set a scalar
            this.vars[token] = val;
        }else if(mask == "v"){ //Then we have a vector
            var [t, i] = token.split(/[\[\]]/);

            var iMask = this.makeMask([i])[0];
            if(iMask == "s"){
                i = this.getValue(i, iMask);
            }

            this.vars[t][i] = val;
        }
    }

    DOPE.prototype.output = function(d){
        if(this.config.onOutput){
            this.config.onOutput(d);
        }
    }

    DOPE.prototype.error = function(msg = null, line = null){
        this.output("SYNTAX ERROR" + (line ? ", LINE " + line : "") + (msg ? ": " + msg : ""));
    }

    DOPE.prototype.makeMask = function(args){
        return args.map(function(t){
            if(t.match(/^[A-Z][0-9]?$/)){
                return "s"; //It's a avriable, ops will understand
            }else if(t.match(/^[0-9\.\-\+]/)){
                return "c"; //It's a constant... don't use restrictions for now
            }else if(t.match(/^[EFGH]\[.*\]$/)){
                return "v" //It's a vector
            }else{
                return "l"; //It's a label
            }
        });
    }

    window.DOPE = DOPE;
})(window, $, undefined);
