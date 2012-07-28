/* 
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function ARMInstructionSet(CPUCore) {
	this.CPUCore = CPUCore;
	this.initialize();
}
ARMInstructionSet.prototype.initialize = function () {
	this.IOCore = this.CPUCore.IOCore;
	this.wait = this.IOCore.wait;
	this.registers = this.CPUCore.registers;
	this.resetPipeline();
	this.compileInstructionMap();
}
ARMInstructionSet.prototype.resetPipeline = function () {
	this.fetch = 0;
	this.decode = 0;
	this.execute = 0;
	this.pipelineInvalid = 0x3;
}
ARMInstructionSet.prototype.executeIteration = function () {
	//Push the new fetch access:
	this.fetch = this.wait.CPUGetOpcode32(this.registers[15]);
	//Execute Conditional Instruction:
	this.executeARM(this.instructionMap[(this.execute >> 20) & 0xFF][(this.execute >> 4) & 0xF]);
	//Update the pipelining state:
	this.execute = this.decode;
	this.decode = this.fetch;
}
ARMInstructionSet.prototype.executeARM = function (instruction) {
	if (this.pipelineInvalid == 0) {
		//Check the condition code:
		if (this.conditionCodeTest()) {
			instruction[0](this, instruction[1]);
		}
	}
	else {
		//Tick the pipeline invalidation:
		this.pipelineInvalid >>= 1;
	}
}
ARMInstructionSet.prototype.conditionCodeTest = function () {
	switch (this.execute >> 28) {
		case 0xE:		//AL (always)
						//Put this case first, since it's the most common!
			return true;
		case 0x0:		//EQ (equal)
			if (!this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x1:		//NE (not equal)
			if (this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x2:		//CS (unsigned higher or same)
			if (!this.CPUCore.CPSRCarry) {
				return false;
			}
			break;
		case 0x3:		//CC (unsigned lower)
			if (this.CPUCore.CPSRCarry) {
				return false;
			}
			break;
		case 0x4:		//MI (negative)
			if (!this.CPUCore.CPSRNegative) {
				return false;
			}
			break;
		case 0x5:		//PL (positive or zero)
			if (this.CPUCore.CPSRNegative) {
				return false;
			}
			break;
		case 0x6:		//VS (overflow)
			if (!this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0x7:		//VC (no overflow)
			if (this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0x8:		//HI (unsigned higher)
			if (!this.CPUCore.CPSRCarry || this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0x9:		//LS (unsigned lower or same)
			if (this.CPUCore.CPSRCarry && !this.CPUCore.CPSRZero) {
				return false;
			}
			break;
		case 0xA:		//GE (greater or equal)
			if (this.CPUCore.CPSRNegative != this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xB:		//LT (less than)
			if (this.CPUCore.CPSRNegative == this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xC:		//GT (greater than)
			if (this.CPUCore.CPSRZero || this.CPUCore.CPSRNegative != this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		case 0xD:		//LE (less than or equal)
			if (!this.CPUCore.CPSRZero && this.CPUCore.CPSRNegative == this.CPUCore.CPSROverflow) {
				return false;
			}
			break;
		//case 0xF:		//Reserved (Never Execute)
		default:
			return false;
	}
}
ARMInstructionSet.prototype.compileInstructionMap = function () {
	this.instructionMap = [
		//0
		[
			[
				this.AND,
				this.lli
			],
			[
				this.AND,
				this.llr
			],
			[
				this.AND,
				this.lri
			],
			[
				this.AND,
				this.lrr
			],
			[
				this.AND,
				this.ari
			],
			[
				this.AND,
				this.arr
			],
			[
				this.AND,
				this.rri
			],
			[
				this.AND,
				this.rrr
			],
			[
				this.AND,
				this.lli
			],
			[
				this.MUL,
				this.NOP
			],
			[
				this.AND,
				this.lri
			],
			[
				this.STRH,
				this.ptrm
			],
			[
				this.AND,
				this.ari
			],
			[
				this.LDRD,
				this.ptrm
			],
			[
				this.AND,
				this.rri
			],
			[
				this.STRD,
				this.ptrm
			]
		],
		//1
		[
			[
				this.ANDS,
				this.lli
			],
			[
				this.ANDS,
				this.llr
			],
			[
				this.ANDS,
				this.lri
			],
			[
				this.ANDS,
				this.lrr
			],
			[
				this.ANDS,
				this.ari
			],
			[
				this.ANDS,
				this.arr
			],
			[
				this.ANDS,
				this.rri
			],
			[
				this.ANDS,
				this.rrr
			],
			[
				this.ANDS,
				this.lli
			],
			[
				this.MULS,
				this.NOP
			],
			[
				this.ANDS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrm
			],
			[
				this.ANDS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrm
			],
			[
				this.ANDS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrm
			]
		],
		//2
		[
			[
				this.EOR,
				this.lli
			],
			[
				this.EOR,
				this.llr
			],
			[
				this.EOR,
				this.lri
			],
			[
				this.EOR,
				this.lrr
			],
			[
				this.EOR,
				this.ari
			],
			[
				this.EOR,
				this.arr
			],
			[
				this.EOR,
				this.rri
			],
			[
				this.EOR,
				this.rrr
			],
			[
				this.EOR,
				this.lli
			],
			[
				this.MLA,
				this.NOP
			],
			[
				this.EOR,
				this.lri
			],
			[
				this.STRH,
				this.ptrm
			],
			[
				this.EOR,
				this.ari
			],
			[
				this.LDRD,
				this.ptrm
			],
			[
				this.EOR,
				this.rri
			],
			[
				this.STRD,
				this.ptrm
			]
		],
		//3
		[
			[
				this.EORS,
				this.lli
			],
			[
				this.EORS,
				this.llr
			],
			[
				this.EORS,
				this.lri
			],
			[
				this.EORS,
				this.lrr
			],
			[
				this.EORS,
				this.ari
			],
			[
				this.EORS,
				this.arr
			],
			[
				this.EORS,
				this.rri
			],
			[
				this.EORS,
				this.rrr
			],
			[
				this.EORS,
				this.lli
			],
			[
				this.MLAS,
				this.NOP
			],
			[
				this.EORS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrm
			],
			[
				this.EORS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrm
			],
			[
				this.EORS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrm
			]
		],
		//4
		[
			[
				this.SUB,
				this.lli
			],
			[
				this.SUB,
				this.llr
			],
			[
				this.SUB,
				this.lri
			],
			[
				this.SUB,
				this.lrr
			],
			[
				this.SUB,
				this.ari
			],
			[
				this.SUB,
				this.arr
			],
			[
				this.SUB,
				this.rri
			],
			[
				this.SUB,
				this.rrr
			],
			[
				this.SUB,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SUB,
				this.lri
			],
			[
				this.STRH,
				this.ptim
			],
			[
				this.SUB,
				this.ari
			],
			[
				this.LDRD,
				this.ptim
			],
			[
				this.SUB,
				this.rri
			],
			[
				this.STRD,
				this.ptim
			]
		],
		//5
		[
			[
				this.SUBS,
				this.lli
			],
			[
				this.SUBS,
				this.llr
			],
			[
				this.SUBS,
				this.lri
			],
			[
				this.SUBS,
				this.lrr
			],
			[
				this.SUBS,
				this.ari
			],
			[
				this.SUBS,
				this.arr
			],
			[
				this.SUBS,
				this.rri
			],
			[
				this.SUBS,
				this.rrr
			],
			[
				this.SUBS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SUBS,
				this.lri
			],
			[
				this.LDRH,
				this.ptim
			],
			[
				this.SUBS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptim
			],
			[
				this.SUBS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptim
			]
		],
		//6
		[
			[
				this.RSB,
				this.lli
			],
			[
				this.RSB,
				this.llr
			],
			[
				this.RSB,
				this.lri
			],
			[
				this.RSB,
				this.lrr
			],
			[
				this.RSB,
				this.ari
			],
			[
				this.RSB,
				this.arr
			],
			[
				this.RSB,
				this.rri
			],
			[
				this.RSB,
				this.rrr
			],
			[
				this.RSB,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.RSB,
				this.lri
			],
			[
				this.STRH,
				this.ptim
			],
			[
				this.RSB,
				this.ari
			],
			[
				this.LDRD,
				this.ptim
			],
			[
				this.RSB,
				this.rri
			],
			[
				this.STRD,
				this.ptim
			]
		],
		//7
		[
			[
				this.RSBS,
				this.lli
			],
			[
				this.RSBS,
				this.llr
			],
			[
				this.RSBS,
				this.lri
			],
			[
				this.RSBS,
				this.lrr
			],
			[
				this.RSBS,
				this.ari
			],
			[
				this.RSBS,
				this.arr
			],
			[
				this.RSBS,
				this.rri
			],
			[
				this.RSBS,
				this.rrr
			],
			[
				this.RSBS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.RSBS,
				this.lri
			],
			[
				this.LDRH,
				this.ptim
			],
			[
				this.RSBS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptim
			],
			[
				this.RSBS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptim
			]
		],
		//8
		[
			[
				this.ADD,
				this.lli
			],
			[
				this.ADD,
				this.llr
			],
			[
				this.ADD,
				this.lri
			],
			[
				this.ADD,
				this.lrr
			],
			[
				this.ADD,
				this.ari
			],
			[
				this.ADD,
				this.arr
			],
			[
				this.ADD,
				this.rri
			],
			[
				this.ADD,
				this.rrr
			],
			[
				this.ADD,
				this.lli
			],
			[
				this.UMULL,
				this.NOP
			],
			[
				this.ADD,
				this.lri
			],
			[
				this.STRH,
				this.ptrp
			],
			[
				this.ADD,
				this.ari
			],
			[
				this.LDRD,
				this.ptrp
			],
			[
				this.ADD,
				this.rri
			],
			[
				this.STRD,
				this.ptrp
			]
		],
		//9
		[
			[
				this.ADDS,
				this.lli
			],
			[
				this.ADDS,
				this.llr
			],
			[
				this.ADDS,
				this.lri
			],
			[
				this.ADDS,
				this.lrr
			],
			[
				this.ADDS,
				this.ari
			],
			[
				this.ADDS,
				this.arr
			],
			[
				this.ADDS,
				this.rri
			],
			[
				this.ADDS,
				this.rrr
			],
			[
				this.ADDS,
				this.lli
			],
			[
				this.UMULLS,
				this.NOP
			],
			[
				this.ADDS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrp
			],
			[
				this.ADDS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrp
			],
			[
				this.ADDS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrp
			]
		],
		//A
		[
			[
				this.ADC,
				this.lli
			],
			[
				this.ADC,
				this.llr
			],
			[
				this.ADC,
				this.lri
			],
			[
				this.ADC,
				this.lrr
			],
			[
				this.ADC,
				this.ari
			],
			[
				this.ADC,
				this.arr
			],
			[
				this.ADC,
				this.rri
			],
			[
				this.ADC,
				this.rrr
			],
			[
				this.ADC,
				this.lli
			],
			[
				this.UMLAL,
				this.NOP
			],
			[
				this.ADC,
				this.lri
			],
			[
				this.STRH,
				this.ptrp
			],
			[
				this.ADC,
				this.ari
			],
			[
				this.LDRD,
				this.ptrp
			],
			[
				this.ADC,
				this.rri
			],
			[
				this.STRD,
				this.ptrp
			]
		],
		//B
		[
			[
				this.ADCS,
				this.lli
			],
			[
				this.ADCS,
				this.llr
			],
			[
				this.ADCS,
				this.lri
			],
			[
				this.ADCS,
				this.lrr
			],
			[
				this.ADCS,
				this.ari
			],
			[
				this.ADCS,
				this.arr
			],
			[
				this.ADCS,
				this.rri
			],
			[
				this.ADCS,
				this.rrr
			],
			[
				this.ADCS,
				this.lli
			],
			[
				this.UMLALS,
				this.NOP
			],
			[
				this.ADCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptrp
			],
			[
				this.ADCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptrp
			],
			[
				this.ADCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptrp
			]
		],
		//C
		[
			[
				this.SBC,
				this.lli
			],
			[
				this.SBC,
				this.llr
			],
			[
				this.SBC,
				this.lri
			],
			[
				this.SBC,
				this.lrr
			],
			[
				this.SBC,
				this.ari
			],
			[
				this.SBC,
				this.arr
			],
			[
				this.SBC,
				this.rri
			],
			[
				this.SBC,
				this.rrr
			],
			[
				this.SBC,
				this.lli
			],
			[
				this.SMULL,
				this.NOP
			],
			[
				this.SBC,
				this.lri
			],
			[
				this.STRH,
				this.ptip
			],
			[
				this.SBC,
				this.ari
			],
			[
				this.LDRD,
				this.ptip
			],
			[
				this.SBC,
				this.rri
			],
			[
				this.STRD,
				this.ptip
			]
		],
		//D
		[
			[
				this.SBCS,
				this.lli
			],
			[
				this.SBCS,
				this.llr
			],
			[
				this.SBCS,
				this.lri
			],
			[
				this.SBCS,
				this.lrr
			],
			[
				this.SBCS,
				this.ari
			],
			[
				this.SBCS,
				this.arr
			],
			[
				this.SBCS,
				this.rri
			],
			[
				this.SBCS,
				this.rrr
			],
			[
				this.SBCS,
				this.lli
			],
			[
				this.SMULLS,
				this.NOP
			],
			[
				this.SBCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptip
			],
			[
				this.SBCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptip
			],
			[
				this.SBCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptip
			]
		],
		//E
		[
			[
				this.RSC,
				this.lli
			],
			[
				this.RSC,
				this.llr
			],
			[
				this.RSC,
				this.lri
			],
			[
				this.RSC,
				this.lrr
			],
			[
				this.RSC,
				this.ari
			],
			[
				this.RSC,
				this.arr
			],
			[
				this.RSC,
				this.rri
			],
			[
				this.RSC,
				this.rrr
			],
			[
				this.RSC,
				this.lli
			],
			[
				this.SMLAL,
				this.NOP
			],
			[
				this.RSC,
				this.lri
			],
			[
				this.STRH,
				this.ptip
			],
			[
				this.RSC,
				this.ari
			],
			[
				this.LDRD,
				this.ptip
			],
			[
				this.RSC,
				this.rri
			],
			[
				this.STRD,
				this.ptip
			]
		],
		//F
		[
			[
				this.RSCS,
				this.lli
			],
			[
				this.RSCS,
				this.llr
			],
			[
				this.RSCS,
				this.lri
			],
			[
				this.RSCS,
				this.lrr
			],
			[
				this.RSCS,
				this.ari
			],
			[
				this.RSCS,
				this.arr
			],
			[
				this.RSCS,
				this.rri
			],
			[
				this.RSCS,
				this.rrr
			],
			[
				this.RSCS,
				this.lli
			],
			[
				this.SMLALS,
				this.NOP
			],
			[
				this.RSCS,
				this.lri
			],
			[
				this.LDRH,
				this.ptip
			],
			[
				this.RSCS,
				this.ari
			],
			[
				this.LDRSB,
				this.ptip
			],
			[
				this.RSCS,
				this.rri
			],
			[
				this.LDRSH,
				this.ptip
			]
		],
		//10
		[
			[
				this.MRS,
				this.rc
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QADD,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLABB,
				this.NOP
			],
			[
				this.SWP,
				this.NOP
			],
			[
				this.SMLATB,
				this.NOP
			],
			[
				this.STRH,
				this.ofrm
			],
			[
				this.SMLABT,
				this.NOP
			],
			[
				this.LDRD,
				this.ofrm
			],
			[
				this.SMLATT,
				this.NOP
			],
			[
				this.STRD,
				this.ofrm
			]
		],
		//11
		[
			[
				this.TSTS,
				this.lli
			],
			[
				this.TSTS,
				this.llr
			],
			[
				this.TSTS,
				this.lri
			],
			[
				this.TSTS,
				this.lrr
			],
			[
				this.TSTS,
				this.ari
			],
			[
				this.TSTS,
				this.arr
			],
			[
				this.TSTS,
				this.rri
			],
			[
				this.TSTS,
				this.rrr
			],
			[
				this.TSTS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.TSTS,
				this.lri
			],
			[
				this.LDRH,
				this.ofrm
			],
			[
				this.TSTS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofrm
			],
			[
				this.TSTS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofrm
			]
		],
		//12
		[
			[
				this.MSR,
				this.rc
			],
			[
				this.BX,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QSUB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLAWB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULWB,
				this.NOP
			],
			[
				this.STRH,
				this.pprm
			],
			[
				this.SMLAWT,
				this.NOP
			],
			[
				this.LDRD,
				this.prrm
			],
			[
				this.SMULWT,
				this.NOP
			],
			[
				this.STRD,
				this.prrm
			]
		],
		//13
		[
			[
				this.TEQS,
				this.lli
			],
			[
				this.TEQS,
				this.llr
			],
			[
				this.TEQS,
				this.lri
			],
			[
				this.TEQS,
				this.lrr
			],
			[
				this.TEQS,
				this.ari
			],
			[
				this.TEQS,
				this.arr
			],
			[
				this.TEQS,
				this.rri
			],
			[
				this.TEQS,
				this.rrr
			],
			[
				this.TEQS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.TEQS,
				this.lri
			],
			[
				this.LDRH,
				this.prrm
			],
			[
				this.TEQS,
				this.ari
			],
			[
				this.LDRSB,
				this.prrm
			],
			[
				this.TEQS,
				this.rri
			],
			[
				this.LDRSH,
				this.prrm
			]
		],
		//14
		[
			[
				this.MRS,
				this.rs
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QDADD,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMLALBB,
				this.NOP
			],
			[
				this.SWPB,
				this.NOP
			],
			[
				this.SMLALTB,
				this.NOP
			],
			[
				this.STRH,
				this.ofim
			],
			[
				this.SMLALBT,
				this.NOP
			],
			[
				this.LDRD,
				this.ofim
			],
			[
				this.SMLALTT,
				this.NOP
			],
			[
				this.STRD,
				this.ofim
			]
		],
		//15
		[
			[
				this.CMPS,
				this.lli
			],
			[
				this.CMPS,
				this.llr
			],
			[
				this.CMPS,
				this.lri
			],
			[
				this.CMPS,
				this.lrr
			],
			[
				this.CMPS,
				this.ari
			],
			[
				this.CMPS,
				this.arr
			],
			[
				this.CMPS,
				this.rri
			],
			[
				this.CMPS,
				this.rrr
			],
			[
				this.CMPS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.CMPS,
				this.lri
			],
			[
				this.LDRH,
				this.ofim
			],
			[
				this.CMPS,
				this.ari
			],
			[
				this.LDRSB,
				this.ofim
			],
			[
				this.CMPS,
				this.rri
			],
			[
				this.LDRSH,
				this.ofim
			]
		],
		//16
		[
			[
				this.MSR,
				this.rs
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.QDSUB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULBB,
				this.NOP
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.SMULTB,
				this.NOP
			],
			[
				this.STRH,
				this.prim
			],
			[
				this.SMULBT,
				this.NOP
			],
			[
				this.LDRD,
				this.prim
			],
			[
				this.SMULTT,
				this.NOP
			],
			[
				this.STRD,
				this.prim
			]
		],
		//17
		[
			[
				this.CMNS,
				this.lli
			],
			[
				this.CMNS,
				this.llr
			],
			[
				this.CMNS,
				this.lri
			],
			[
				this.CMNS,
				this.lrr
			],
			[
				this.CMNS,
				this.ari
			],
			[
				this.CMNS,
				this.arr
			],
			[
				this.CMNS,
				this.rri
			],
			[
				this.CMNS,
				this.rrr
			],
			[
				this.CMNS,
				this.lli
			],
			[
				this.UNDEFINED,
				this.NOP
			],
			[
				this.CMNS,
				this.lri
			],
			[
				this.LDRH,
				this.prim
			],
			[
				this.CMNS,
				this.ari
			],
			[
				this.LDRSB,
				this.prim
			],
			[
				this.CMNS,
				this.rri
			],
			[
				this.LDRSH,
				this.prim
			]
		],
	];
}