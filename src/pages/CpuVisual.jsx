import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, SkipForward, Landmark, Database, RotateCcw } from 'lucide-react';

const INITIAL_RAM = [
  { address: "0x00", value: 0, instruction: "LOAD 0x05", label: "Inst 1" },
  { address: "0x01", value: 0, instruction: "ADD 0x06", label: "Inst 2" },
  { address: "0x02", value: 0, instruction: "STORE 0x07", label: "Inst 3" },
  { address: "0x03", value: 0, instruction: "HALT", label: "Inst 4" },
  { address: "0x04", value: 0, instruction: "", label: "Reserved" },
  { address: "0x05", value: 12, instruction: "", label: "X" },
  { address: "0x06", value: 25, instruction: "", label: "Y" },
  { address: "0x07", value: 0, instruction: "", label: "Z" }
];

const PROGRAM_PRESET_1 = [
  { address: "0x00", value: 0, instruction: "LOAD 0x05", label: "Inst 1" },
  { address: "0x01", value: 0, instruction: "ADD 0x06", label: "Inst 2" },
  { address: "0x02", value: 0, instruction: "STORE 0x07", label: "Inst 3" },
  { address: "0x03", value: 0, instruction: "HALT", label: "Inst 4" },
  { address: "0x04", value: 0, instruction: "", label: "Reserved" },
  { address: "0x05", value: 12, instruction: "", label: "X" },
  { address: "0x06", value: 25, instruction: "", label: "Y" },
  { address: "0x07", value: 0, instruction: "", label: "Result Z" }
];

const PROGRAM_PRESET_2 = [
  { address: "0x00", value: 0, instruction: "LOAD 0x05", label: "Inst 1" },
  { address: "0x01", value: 0, instruction: "SUB 0x06", label: "Inst 2" },
  { address: "0x02", value: 0, instruction: "STORE 0x07", label: "Inst 3" },
  { address: "0x03", value: 0, instruction: "HALT", label: "Inst 4" },
  { address: "0x04", value: 0, instruction: "", label: "Reserved" },
  { address: "0x05", value: 45, instruction: "", label: "A" },
  { address: "0x06", value: 15, instruction: "", label: "B" },
  { address: "0x07", value: 0, instruction: "", label: "Result C" }
];

export default function CpuVisual({ embeddedMode = false, onCoinsEarned }) {
  const [registers, setRegisters] = useState({
    PC: 0,
    MAR: 0,
    MBR: 0,
    IR: "None",
    AC: 0,
    STATUS: "IDLE"
  });

  const [ram, setRam] = useState(INITIAL_RAM);
  const [stage, setStage] = useState("IDLE");
  const [cycleStep, setCycleStep] = useState("Simulator siap. Klik STEP atau RUN untuk memulai Fetch.");
  const [speed, setSpeed] = useState(1500); // speed in ms
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const playTimer = useRef(null);

  // Active path lights for micro-operations visualization
  const [activePaths, setActivePaths] = useState({
    pcToMar: false,
    ramToMbr: false,
    mbrToIr: false,
    mbrToAlu: false,
    aluToAc: false,
    acToMbr: false,
    mbrToRam: false
  });

  const resetPaths = () => {
    setActivePaths({
      pcToMar: false,
      ramToMbr: false,
      mbrToIr: false,
      mbrToAlu: false,
      aluToAc: false,
      acToMbr: false,
      mbrToRam: false
    });
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    if (playTimer.current) clearInterval(playTimer.current);
    setRegisters({
      PC: 0,
      MAR: 0,
      MBR: 0,
      IR: "None",
      AC: 0,
      STATUS: "IDLE"
    });
    setStage("IDLE");
    setCycleStep("Sistem di-reset. Program Counter (PC) kembali menunjuk ke alamat instruksi pertama 0x00.");
    resetPaths();
  };

  const loadPreset = (index) => {
    handleReset();
    if (index === 1) {
      setRam(JSON.parse(JSON.stringify(PROGRAM_PRESET_1)));
      setCycleStep("Program Pengurangan X + Y berhasil dimuat.");
    } else {
      setRam(JSON.parse(JSON.stringify(PROGRAM_PRESET_2)));
      setCycleStep("Program Pengurangan A - B berhasil dimuat.");
    }
  };

  const runSingleCycleStep = () => {
    if (stage === "HALTED") return;

    if (stage === "IDLE" || stage === "EXECUTE") {
      // ----------------- FETCH STAGE -----------------
      const currentPC = registers.PC;
      if (currentPC >= ram.length || currentPC < 0) {
        setStage("HALTED");
        setRegisters(prev => ({ ...prev, STATUS: "HALTED" }));
        setCycleStep("ERROR: PC keluar batas alamat memori. Eksekusi dihentikan.");
        return;
      }

      const instCell = ram[currentPC];
      if (!instCell.instruction) {
        setStage("HALTED");
        setRegisters(prev => ({ ...prev, STATUS: "HALTED" }));
        setCycleStep("PC menunjuk memori kosong tanpa instruksi. Eksekusi Halt.");
        return;
      }

      setStage("FETCH");
      setRegisters(prev => ({
        ...prev,
        MAR: currentPC,
        STATUS: "FETCH"
      }));

      // Lighting paths: PC -> MAR
      setActivePaths(prev => ({ ...prev, pcToMar: true }));

      setCycleStep(`[FETCH] Mengambil instruksi dari indeks memori PC (0x0${currentPC}). MAR diset ke ${currentPC}.`);

      // Delayed second step of FETCH: RAM -> MBR -> IR
      setTimeout(() => {
        const valRepresentation = 100 + currentPC; // virtual internal assembly layout
        setRegisters(prev => ({
          ...prev,
          MBR: valRepresentation,
          IR: instCell.instruction || ""
        }));
        setActivePaths(prev => ({ ...prev, ramToMbr: true, mbrToIr: true }));
        setCycleStep(`[FETCH] Instruksi '${instCell.instruction}' dimasukkan ke MBR, lalu didekodekan ke Instruction Register (IR).`);
      }, speed / 3);

    } else if (stage === "FETCH") {
      // ----------------- DECODE STAGE -----------------
      setStage("DECODE");
      setRegisters(prev => ({ ...prev, STATUS: "DECODE" }));
      resetPaths();

      const ir = registers.IR;
      const parts = ir.split(" ");
      const opcode = parts[0];
      const addressHex = parts[1] || "";
      const targetAddress = parseInt(addressHex, 16);

      if (opcode === "HALT") {
        setCycleStep(`[DECODE] Mengidentifikasi Opcode: HALT. Tidak memerlukan operand. Mempersiapkan terminasi CPU.`);
      } else {
        setRegisters(prev => ({ ...prev, MAR: isNaN(targetAddress) ? 0 : targetAddress }));
        setCycleStep(`[DECODE] Opcode: ${opcode}. Membaca operand di alamat ${addressHex}. Melakukan set MAR ke ${targetAddress}.`);
      }

    } else if (stage === "DECODE") {
      // ----------------- EXECUTE STAGE -----------------
      setStage("EXECUTE");
      setRegisters(prev => ({ ...prev, STATUS: "EXECUTE" }));
      resetPaths();

      const ir = registers.IR;
      const parts = ir.split(" ");
      const opcode = parts[0];
      const addressHex = parts[1] || "";
      const targetAddress = parseInt(addressHex, 16);

      // Fetch operand value from RAM for instructions that need it
      let operandValue = 0;
      if (!isNaN(targetAddress) && targetAddress >= 0 && targetAddress < ram.length) {
        operandValue = ram[targetAddress].value;
      }

      if (opcode === "LOAD") {
        // LOAD RAM -> AC
        setRegisters(prev => ({
          ...prev,
          MBR: operandValue,
          AC: operandValue,
          PC: prev.PC + 1
        }));
        setActivePaths(prev => ({ ...prev, ramToMbr: true, mbrToAlu: true, aluToAc: true }));
        setCycleStep(`[EXECUTE] Memindahkan data RAM[${addressHex}] (${operandValue}) ke MBR kemudian dimuat (LOAD) ke Accumulator (AC). PC dinaikkan ke ${registers.PC + 1}.`);

      } else if (opcode === "ADD") {
        // ADD RAM to AC
        const originalAC = registers.AC;
        const newAC = originalAC + operandValue;
        setRegisters(prev => ({
          ...prev,
          MBR: operandValue,
          AC: newAC,
          PC: prev.PC + 1
        }));
        setActivePaths(prev => ({ ...prev, ramToMbr: true, mbrToAlu: true, aluToAc: true }));
        setCycleStep(`[EXECUTE] Menambahkan nilai MBR (${operandValue}) ke AC (${originalAC}). Hasil AC = ${newAC}. PC dinaikkan ke ${registers.PC + 1}.`);

      } else if (opcode === "SUB") {
        // SUB RAM from AC
        const originalAC = registers.AC;
        const newAC = originalAC - operandValue;
        setRegisters(prev => ({
          ...prev,
          MBR: operandValue,
          AC: newAC,
          PC: prev.PC + 1
        }));
        setActivePaths(prev => ({ ...prev, ramToMbr: true, mbrToAlu: true, aluToAc: true }));
        setCycleStep(`[EXECUTE] Mengurangkan AC (${originalAC}) dengan MBR (${operandValue}). Hasil AC = ${newAC}. PC dinaikkan ke ${registers.PC + 1}.`);

      } else if (opcode === "STORE") {
        // STORE AC -> RAM
        if (isNaN(targetAddress) || targetAddress < 0 || targetAddress >= ram.length) {
          setStage("HALTED");
          setCycleStep("ERROR: Alamat target STORE salah.");
          return;
        }

        const valueToStore = registers.AC;
        
        // Update memori RAM
        const updatedRam = [...ram];
        updatedRam[targetAddress].value = valueToStore;
        setRam(updatedRam);

        setRegisters(prev => ({
          ...prev,
          MBR: valueToStore,
          PC: prev.PC + 1
        }));
        setActivePaths(prev => ({ ...prev, acToMbr: true, mbrToRam: true }));
        setCycleStep(`[EXECUTE] Menyimpan (STORE) nilai AC (${valueToStore}) ke MBR lalu ditulis ke alamat RAM[${addressHex}]. PC dinaikkan ke ${registers.PC + 1}.`);

      } else if (opcode === "HALT") {
        setStage("HALTED");
        setRegisters(prev => ({ ...prev, STATUS: "HALTED" }));
        setCycleStep("[EXECUTE-HALT] Instruksi HALT dieksekusi. Siklus Fetch-Decode-Execute dihetikan dengan sukses.");
        setIsAutoPlaying(false);
        if (onCoinsEarned) onCoinsEarned();
      } else {
        // Unknown opcode
        setStage("HALTED");
        setRegisters(prev => ({ ...prev, STATUS: "HALTED" }));
        setCycleStep(`[ERROR] Opcode '${opcode}' tidak dikenal.`);
        setIsAutoPlaying(false);
      }
    }
  };

  // Watch autoplay states
  useEffect(() => {
    if (isAutoPlaying) {
      playTimer.current = setInterval(() => {
        runSingleCycleStep();
      }, speed);
    } else {
      if (playTimer.current) clearInterval(playTimer.current);
    }

    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isAutoPlaying, stage, registers, speed]);

  const updateMemoryValue = (index, valStr) => {
    const val = parseInt(valStr);
    if (isNaN(val)) return;
    const updated = [...ram];
    updated[index].value = val;
    setRam(updated);
  };

  return (
    <div className={`h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950`} id="cpu-simulator-container">
      <div className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-border dark:border-slate-800 pb-5 mb-5 gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600 animate-pulse" />
              CPU Visual Cycle Simulator (Fetch-Decode-Execute)
            </h2>
            <p className="text-xs text-secondary mt-1 font-medium">
              Rangkuman fungsional sasis mesin komputer model Stallings Chapter 3
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 p-1.5 rounded-xl self-start xl:self-auto">
            <span className="text-[10px] text-secondary font-bold px-2">Preset Program:</span>
            <button
              onClick={() => loadPreset(1)}
              className="px-3 py-1.5 text-xs font-black font-mono rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm"
            >
              Addition (X+Y)
            </button>
            <button
              onClick={() => loadPreset(2)}
              className="px-3 py-1.5 text-xs font-black font-mono rounded-lg bg-pink-500 hover:bg-pink-400 text-white transition-all cursor-pointer shadow-sm"
            >
              Subtraction (A-B)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Memory Board Frame */}
          <div className="lg:col-span-4 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold text-secondary pb-2 border-b border-border dark:border-slate-800">
              <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-indigo-600" /> RAM (Main Memory)</span>
              <span className="text-[10px] text-secondary font-bold">Ubah Nilai Bebas</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {ram.map((cell, idx) => {
                const isActive = registers.MAR === idx && (stage === "FETCH" || stage === "DECODE" || stage === "EXECUTE");
                const isPCPoint = registers.PC === idx;

                return (
                  <div
                    key={cell.address}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                      isActive 
                        ? "bg-indigo-100 dark:bg-indigo-500/20 border-indigo-500/50 text-indigo-700 dark:text-indigo-400 shadow-sm" 
                        : isPCPoint 
                          ? "bg-pink-500/20 border-pink-500/50 text-pink-500 dark:text-pink-300 shadow-sm" 
                          : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-secondary font-bold">{cell.address}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isPCPoint ? "bg-pink-500/30 text-pink-500 dark:text-pink-300" : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 text-secondary"}`}>
                        {cell.label || "Data"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {cell.instruction ? (
                        <span className="text-[11px] text-indigo-600 font-extrabold">{cell.instruction}</span>
                      ) : (
                        <input
                          type="number"
                          value={cell.value}
                          onChange={(e) => updateMemoryValue(idx, e.target.value)}
                          className="w-12 bg-black/5 dark:bg-black/40 text-foreground border border-border dark:border-slate-700 text-center rounded-lg py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-secondary leading-relaxed pt-1 flex items-start gap-1">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full inline-block animate-ping shrink-0 mt-1"></span>
              <span>Kotak nilai kanan (X/Y) dapat diisi angka dinamis untuk memodifikasi hasil simulasi jalannya interkoneksi bus!</span>
            </p>
          </div>

          {/* Core CPU Registers & Execution visualization schematic */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-inner">
              {/* Stage banner indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                  stage === "FETCH" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" :
                  stage === "DECODE" ? "bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/30" :
                  stage === "EXECUTE" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-500/30" :
                  stage === "HALTED" ? "bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-500/30" :
                  "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 text-secondary"
                }`}>
                  STAGE: {stage}
                </span>
              </div>

              <span className="text-[10px] font-extrabold font-mono text-secondary uppercase tracking-widest block mb-4">INTERNAL CPU SCHEMATIC CIRCUITS</span>

              {/* Circuit Block Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2 relative z-10">
                
                {/* Control Unit Sub-Section */}
                <div className="border border-border dark:border-slate-800 bg-slate-50 dark:bg-black/20 p-3.5 rounded-xl space-y-3 shadow-sm">
                  <span className="text-[10px] font-black text-secondary uppercase block text-center border-b border-border dark:border-slate-800 pb-1.5">Control Unit</span>
                  
                  <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 p-2.5 rounded-xl">
                    <span className="text-[9px] text-secondary font-bold block uppercase">Program Counter (PC)</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-mono font-black text-pink-500 dark:text-pink-400">0x0{registers.PC}</span>
                      <span className="text-[9px] text-secondary font-bold font-mono">Next Addr</span>
                    </div>
                  </div>

                  <div className={`bg-[var(--bg-surface)] shadow-sm p-2.5 rounded-xl border transition-all ${activePaths.mbrToIr ? "border-indigo-500/50 bg-indigo-100 dark:bg-indigo-500/20" : "border-border dark:border-slate-700"}`}>
                    <span className="text-[9px] text-secondary font-bold block uppercase">Inst Register (IR)</span>
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{registers.IR}</span>
                  </div>
                </div>

                {/* Memory Interface Registers */}
                <div className="border border-border dark:border-slate-800 bg-slate-50 dark:bg-black/20 p-3.5 rounded-xl space-y-3 shadow-sm">
                  <span className="text-[10px] font-black text-secondary uppercase block text-center border-b border-border dark:border-slate-800 pb-1.5">Memory Interface</span>

                  <div className={`bg-[var(--bg-surface)] shadow-sm p-2.5 rounded-xl border transition-all ${activePaths.pcToMar ? "border-pink-500/50 bg-pink-500/20" : "border-border dark:border-slate-700"}`}>
                    <span className="text-[9px] text-secondary font-bold block uppercase">Addr Register (MAR)</span>
                    <span className="text-xs font-mono font-black text-secondary mt-0.5 block">0x0{registers.MAR}</span>
                  </div>

                  <div className={`bg-[var(--bg-surface)] shadow-sm p-2.5 rounded-xl border transition-all ${activePaths.ramToMbr || activePaths.acToMbr ? "border-indigo-500/50 bg-indigo-100 dark:bg-indigo-500/20" : "border-border dark:border-slate-700"}`}>
                    <span className="text-[9px] text-secondary font-bold block uppercase">Buffer Register (MBR)</span>
                    <span className="text-xs font-mono font-black text-secondary mt-0.5 block">{registers.MBR}</span>
                  </div>
                </div>

                {/* Execution Block (ALU / AC) */}
                <div className="border border-border dark:border-slate-800 bg-slate-50 dark:bg-black/20 p-3.5 rounded-xl space-y-3 shadow-sm">
                  <span className="text-[10px] font-black text-secondary uppercase block text-center border-b border-border dark:border-slate-800 pb-1.5">Execution Core (ALU)</span>

                  <div className={`bg-[var(--bg-surface)] shadow-sm p-2.5 rounded-xl border transition-all ${activePaths.aluToAc ? "border-emerald-500/50 bg-emerald-500/20" : "border-border dark:border-slate-700"}`}>
                    <span className="text-[9px] text-secondary font-bold block uppercase">Accumulator (AC)</span>
                    <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-500 mt-0.5 block">{registers.AC}</span>
                  </div>

                  <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 p-2 rounded-lg text-[10px] font-mono text-secondary flex items-center justify-between">
                    <span className="font-bold">Execution ALU</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black">ACTIVE</span>
                  </div>
                </div>

              </div>

              {/* Glowing Bus Lines Map */}
              <div className="border-t border-border dark:border-slate-800 mt-3 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono font-bold text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${activePaths.pcToMar ? "bg-pink-500 shadow shadow-pink-500/50 animate-pulse" : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700"}`} />
                  <span>PC → MAR (Addr Bus)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${activePaths.ramToMbr ? "bg-indigo-500 shadow shadow-indigo-500/50 animate-pulse" : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700"}`} />
                  <span>RAM → MBR (Data Read)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${activePaths.mbrToIr ? "bg-indigo-400 shadow shadow-indigo-400/50 animate-pulse" : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700"}`} />
                  <span>MBR → IR (Decode Bus)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${activePaths.mbrToRam ? "bg-rose-500 shadow shadow-rose-500/50 animate-pulse" : "bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700"}`} />
                  <span>MBR → RAM (Write Bus)</span>
                </div>
              </div>
            </div>

            {/* Feedback console monitor */}
            <div className="bg-slate-50 dark:bg-black/40 border border-border dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-secondary shadow-md">
              <span className="text-[10px] text-secondary uppercase block mb-1.5 font-bold">LOG SIKLUS MIKRO-OPERASI (MICRO-OPERATIONS CONSOLE)</span>
              <div className="bg-[var(--bg-surface)] dark:bg-black/60 border border-border dark:border-slate-800 p-3.5 rounded-xl min-h-[48px] flex items-center justify-start text-emerald-600 dark:text-emerald-500 font-medium shadow-inner">
                <span className="leading-relaxed">{cycleStep}</span>
              </div>
            </div>

            {/* Control bar buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  id="step-forward-btn"
                  onClick={runSingleCycleStep}
                  disabled={stage === "HALTED"}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  Step Cycle (Satu Siklus)
                </button>

                {!isAutoPlaying ? (
                  <button
                    id="auto-run-btn"
                    onClick={() => setIsAutoPlaying(true)}
                    disabled={stage === "HALTED"}
                    className="px-5 py-3 bg-pink-500 hover:bg-pink-400 disabled:opacity-30 disabled:hover:bg-pink-500 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-pink-500/10 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Auto Run
                  </button>
                ) : (
                  <button
                    id="stop-btn"
                    onClick={() => setIsAutoPlaying(false)}
                    className="px-5 py-3 bg-rose-500 hover:bg-rose-450 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                    Stop Play
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 px-4 py-2 rounded-xl text-xs text-secondary font-mono">
                <span className="text-[10px] font-bold uppercase">Speed:</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="bg-black/5 dark:bg-black/40 text-foreground border border-border dark:border-slate-700 rounded-lg py-1 px-1.5 font-bold uppercase text-[10px] focus:outline-none"
                >
                  <option value={2000}>Sangat Lambat (2s)</option>
                  <option value={1500}>Normal (1.5s)</option>
                  <option value={750}>Cepat (0.75s)</option>
                  <option value={300}>Hyper (0.3s)</option>
                </select>

                <button
                  id="reset-cpu-btn"
                  onClick={handleReset}
                  className="text-secondary hover:text-indigo-600 font-bold ml-1 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Registers & PC"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
