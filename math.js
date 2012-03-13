/*
  sections of this library
    implement formulas as trees
    generic functions
    tokenizer
    parser
    simplify prototype based oop
    temporary code
*/

//
//implement formulas as trees
//

//make new true from node value and children
tree = function() {
  var defaultPty = mkpty()
  //default toString function
  defaultPty.toString = function() {
    var s = "tree(" + this.value + ",["
    for(var i = 0; i < this.children.length; i++) {
      s += (i != 0 ? "," : "") + this.children[i]
    }
    return s + "])"
  }
  return function(value,children,/*optional*/pty) {
    var parent = mkobj(pty ? pty : defaultPty)
    parent.value = value
    parent.children = children
    return parent
  }
} ()

//implement atomic formula (set membership)
atomicFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return this.children[0] + ":" + this.children[1]
  }
  return function(var1,var2) { return tree(":",[var1,var2],pty) }
} ()

//implement AND connective
andFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "(" + this.children[0] + " && " + this.children[1] + ")"
  }
  return function(form1,form2) { return tree("&&",[form1,form2],pty) }
} ()

//implement OR connective
orFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "(" + this.children[0] + " || " + this.children[1] + ")"
  }
  return function(form1,form2) { return tree("||",[form1,form2],pty) }
} ()

//implement IMPLIES connective
impFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "(" + this.children[0] + " => " + this.children[1] + ")"
  }
  return function(form1,form2) { return tree("=>",[form1,form2],pty) }
} ()

//implement NOT connective
notFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "! " + this.children[0]
  }
  return function(form1) { return tree("!",[form1],pty) }
} ()

//implement universal quantifier
allFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "all " + this.children[0] + " " + this.children[1]
  }
  return function(var1,form1) { return tree("all",[var1,form1],pty) }
} ()

//implement existential connective
exFormula = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "ex " + this.children[0] + " " + this.children[1]
  }
  return function(var1,form1) { return tree("ex",[var1,form1],pty) }
} ()

//
//generic functions
//

//apply function to array items
//this is example of higher order function
function map(lambda,array) {
  var length = array.length
  var newArray = new Array()
  for(var i = 0; i < length; i++) {
    newArray.push(lambda(array[i]))
  }
  return newArray
}

//apply filter to array items
function filter(lambda,array) {
  var newArray = new Array()
  for(var i = 0; i < array.length; i++) {
    if(lambda(array[i])) newArray.push(array[i])
  }
  return newArray
}

//lazy list
cons = function() {
  var pty = mkpty()
  pty.toString = function() {
    var s = "lazy[", l
    for(l = this; l != null; l = l.getTail())
      s += (l == this ? "" : ",") + l.head
    return s + "]"
  }
  return function(head,getTail) {
    var obj = mkobj(pty)
    obj.head = head
    obj.getTail = getTail
    return obj
  }
} ()

//infite list
function inf(a) {
  return cons(a,function(){return inf(a)})
}

//Haskell take function
function take(n,l) {
  return n==0?null:cons(l.head,function(){return take(n-1,l.getTail())})
}

//pair
pair = function() {
  var pty = mkpty()
  pty.toString = function() {
    return "(" + this.x + "," + this.y + ")"
  }
  return function(x,y) {
    var obj = mkobj(pty)
    obj.x = x
    obj.y = y
    return obj
  }
} ()

//
//simplify prototype based oop
//

//make object that can be used as prototype
function mkpty(pty) {
  //pty: optional argument, inherit if set
  var pty2 = pty ? object(pty) : {}
  pty2.constructor = function() {}
  pty2.constructor.prototype = pty2
  return pty2
}

//make object only, inherit from pty
function mkobj(pty) {
  return new pty.constructor()
}

//
//tokenizer
//

//words, operators, comments, punctuation
tokenizePattern =
  //(Identifier|ReservedWord)|MultiCharOperator|Comment|Other
  /[_a-z][_a-z0-9]*|&&|\|\||=>|\/\/.*$|\/\*.*?\*\/|./gi
//tokenizePattern.compile(tokenizePattern)

//whitespace and comments
function iswhitespace(s) {
  switch(s.charAt(0)) {
    case '\t': case '\n': case '\r': case ' ':
      return true
    case '/':
      switch(s.charAt(1)) {
        case '*': case '/':
          return true
        default:
          return false
      }
    default:
      return false
  }
}

//from raw string to filtered, tokenized lazy list
function tokenize(s) {
  if(s === "") return null
  var tokenized = s.match(tokenizePattern)
  var filter = function(a,j) {
    return j === a.length ? null :
      iswhitespace(a[j]) ? filter(a,j+1) :
      cons(a[j],function(){return filter(a,j+1)})
  }
  return filter(tokenized,0)
}

//
//parser
//

//the parser handles the following grammar:
//ImpFormula -> OrFormula "=>" ImpFormula
//ImpFormula -> OrFormula
//OrFormula -> OrFormula "||" AndFormula
//OrFormula -> AndFormula
//AndFormula -> AndFormula "&&" UnaryFormula
//AndFormula -> UnaryFormula
//UnaryFormula -> "!" UnaryFormula
//UnaryFormula -> "all" Identifier UnaryFormula
//UnaryFormula -> "ex" Identifier UnaryFormula
//UnaryFormula -> WrappedFormula
//WrappedFormula -> "(" ImpFormula ")"
//WrappedFormula -> AtomicFormula
//AtomicFormula -> Identifier ":" Identifier
//Identifier -> (unrevserved word)

//not yet implemented:
//WrappedFormula -> DefinedFormula
//DefinedFormula -> Identifier "(" IdentifierList ")"
//IdentifierList -> Identifier "," IdentifierList
//IdentifierList -> Identifier

//also not yet implemented: productions beyond formulas, e.g.:
//AxAssertion -> AxChoiceAssertion
//AxChoiceAssertion -> MetaVar "=" "axChoice" "(" ")"
//AxAssertion -> Imp1Assertion
//Imp1Assertion -> MetaVar "=" "imp1" "(" ImpFormula "," ImpFormula ")"
//MetaVar -> (word preceded by "$")

//such would be needed for proofs, and they too need to be parsed

//in the following, values shall be denoted as follows:
//l,l1,l2,...: lazy list of tokens
//p,p1,p2,...: pair of (formula, lazy list of tokens)
//f,f1,f2,...: formula
//return value: pair of (formula, lazy list of tokens)

//each level of the hierarchy is represented by a function.
//parseImpFormula() corresponds to the highest level and returns the result
//of parsing any formula passed.
//null return value signifies failure.
//each function receives a string to be parsed and parses only part of the
//string.  The function returns two values: parsed formula and unparsed
//remainder.
//"=>" is right associative.
//"&&" and "||" are left associative and their partially parsed results
//are passed in the second argument as an accumulator.

function parseToken(l,t) {
  if(l === null) return null
  if(l.head !== t) return null
  return pair(t,l.getTail())
}

//hash table of reserved words: names mangled by adding "+"
reserved = {
  "+all" : true,
  "+ex" : true
}

function parseIdentifier(l) {
  if(l === null) return null
  var c = l.head.charAt(0)
  if(reserved["+"+l.head]) return null
  var b = c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c === '_'
  return b ? pair(l.head,l.getTail()) : null
}

function parseAtomicFormula(l) {
  var p = parseIdentifier(l)
  if(p === null) return null
  var p2 = parseToken(p.y,":")
  if(p2 === null) return null
  var p3 = parseIdentifier(p2.y)
  if(p3 === null) return null
  return pair(atomicFormula(p.x,p3.x),p3.y)
}

//handle parentheses
function parseWrappedFormula(l) {
  var p = parseToken(l,"(")
  if(p === null) return parseAtomicFormula(l)
  var p2 = parseImpFormula(p.y)
  if(p2 === null) return null
  var p3 = parseToken(p2.y,")")
  if(p3 === null) return null
  return pair(p2.x,p3.y)
}

//!,all,ex
function parseUnaryFormula(l) {
  if(l === null) return null
  var l2 = l.getTail()
  if(l.head === "!") {
    var p = parseUnaryFormula(l2)
    if(p === null) return null
    return pair(notFormula(p.x),p.y)
  }
  if(l.head === "all") {
    p = parseIdentifier(l2)
    if(p === null) return null
    var p2 = parseUnaryFormula(p.y)
    if(p2 === null) return null
    return pair(allFormula(p.x,p2.x),p2.y)
  }
  if(l.head === "ex") {
    p = parseIdentifier(l2)
    if(p === null) return null
    p2 = parseUnaryFormula(p.y)
    if(p2 === null) return null
    return pair(exFormula(p.x,p2.x),p2.y)
  }
  return parseWrappedFormula(l)
}
  
function parseAndFormula(l,f) {
  var p = parseUnaryFormula(l)
  if(p === null) return null
  var f2 = f ? andFormula(f,p.x) : p.x
  var p2 = parseToken(p.y,"&&")
  if(p2 === null) return pair(f2,p.y)
  var p3 = parseAndFormula(p2.y,f2)
  if(p3 === null) return null
  return p3
}

function parseOrFormula(l,f) {
  var p = parseAndFormula(l)
  if(p === null) return null
  var f2 = f ? orFormula(f,p.x) : p.x
  var p2 = parseToken(p.y,"||")
  if(p2 === null) return pair(f2,p.y)
  var p3 = parseOrFormula(p2.y,f2)
  if(p3 === null) return null
  return p3
}

function parseImpFormula(l) {
  var p = parseOrFormula(l)
  if(p === null) return null
  var p2 = parseToken(p.y,"=>")
  if(p2 === null) return p
  var p3 = parseImpFormula(p2.y)
  if(p3 === null) return null
  return pair(impFormula(p.x,p3.x),p3.y)
}

//TODO: Complete parser features

//
//temporary code
//
function br() { return "<br />" }

function toHTML(l) {
  return l ? l.head + br() + toHTML(l.getTail()) : ""
}

function example() {
  return new Array(tree("=",[tree("+",[2,2]),4]),
    atomicFormula("x","y"),
    andFormula(atomicFormula("x","y"),atomicFormula("x","z")),
    orFormula(atomicFormula("x","y"),atomicFormula("x","z")),
    impFormula(atomicFormula("x","y"),atomicFormula("x","z")),
    notFormula(atomicFormula("x","y")),
    allFormula("x",atomicFormula("x","y")),
    exFormula("x",atomicFormula("x","y")),
    "'!all x(x:y=>x:z)/*zfc*/' tokenizes as:<br />" +
      toHTML(tokenize("!all x(x:y=>x:z)/*zfc*/")),
    take(5,inf("a")),
    parseToken(tokenize(""),":"),
    parseToken(tokenize("y"),":"),
    parseToken(tokenize(":y"),":"),
    parseIdentifier(tokenize("")),
    parseIdentifier(tokenize(":y")),
    parseIdentifier(tokenize("x:y")),
    parseAtomicFormula(tokenize("")),
    parseAtomicFormula(tokenize("x")),
    parseAtomicFormula(tokenize("x:")),
    parseAtomicFormula(tokenize("x:y z")),
    parseAtomicFormula(tokenize("x:y")),
    parseAndFormula(tokenize("x:y")),
    parseAndFormula(tokenize("x:y && x:z && y:")),
    parseAndFormula(tokenize("x:y && x:z && y:z &")),
    parseAndFormula(tokenize("x:y && x:z && y:z &&")),
    parseAndFormula(tokenize("x:y && x:z && y:z && x:y")),
    parseOrFormula(tokenize("x:y || x:")),
    parseOrFormula(tokenize("x:y || x:z |")),
    parseOrFormula(tokenize("x:y || x:z ||")),
    parseOrFormula(tokenize("x:y || x:z || y:z")),
    parseImpFormula(tokenize("x:y => y:z => z:")),
    parseImpFormula(tokenize("x:y => y:z => z:w =")),
    parseImpFormula(tokenize("x:y => y:z => z:w => ")),
    parseImpFormula(tokenize("x:y => y:z => z:w => x:w")),
    parseImpFormula(tokenize("x:y && y:z && z:w => x:w")),
    parseUnaryFormula(tokenize("x:")),
    parseUnaryFormula(tokenize("! x:y")),
    parseUnaryFormula(tokenize("all")),
    parseUnaryFormula(tokenize("all x")),
    parseUnaryFormula(tokenize("all x x:y")),
    parseImpFormula(tokenize("all x ! x:x")),
    parseImpFormula(tokenize("x:y || ! x:y")),
    parseUnaryFormula(tokenize("ex")),
    parseUnaryFormula(tokenize("ex y")),
    parseUnaryFormula(tokenize("ex y x:y")),
    parseWrappedFormula(tokenize("(")),
    parseWrappedFormula(tokenize("(x:y")),
    parseWrappedFormula(tokenize("(x:y)")),
    parseImpFormula(tokenize("all x ! x:x")),
    parseImpFormula(tokenize(
      "x:u && (x:v || x:w) => x:u && x:v || x:u && x:w"))
    )
}
