import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Link as LinkIcon,
  Trash2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { SLLNode, SLLPointerState, SLLActionModalType, SLLTaskDef } from '../../types/sllGame';

interface SLLActionModalProps {
  modalType: SLLActionModalType;
  onClose: () => void;
  nodes: SLLNode[];
  pointers: SLLPointerState;
  activeTask: SLLTaskDef;
  selectedAddress: number | null;
  onCreateNode: (data: number, address: number, nextAddress: number | null) => void;
  onChangeNext: (fromAddress: number, toNextAddress: number | null) => void;
  onSetHead: (address: number | null) => void;
  onSetTail: (address: number | null) => void;
  onDeleteNode: (address: number) => void;
  hintLevel: number;
  onAdvanceHint: () => void;
}

export const SLLActionModal: React.FC<SLLActionModalProps> = ({
  modalType,
  onClose,
  nodes,
  pointers,
  activeTask,
  selectedAddress,
  onCreateNode,
  onChangeNext,
  onSetHead,
  onSetTail,
  onDeleteNode,
  hintLevel,
  onAdvanceHint,
}) => {
  // Compute next available unique address default
  const existingAddresses = nodes.map((n) => n.address);
  const defaultAddr = existingAddresses.length > 0 ? Math.max(...existingAddresses) + 1 : 1001;

  // Form states
  const [dataInput, setDataInput] = useState<string>('');
  const [addressInput, setAddressInput] = useState<string>('');
  const [nextInput, setNextInput] = useState<string>('NULL');

  // Change Next state
  const [targetNodeAddr, setTargetNodeAddr] = useState<number | null>(null);
  const [newNextInput, setNewNextInput] = useState<string>('NULL');

  // Pointer state
  const [headInput, setHeadInput] = useState<string>('');
  const [tailInput, setTailInput] = useState<string>('');

  // Delete state
  const [deleteAddr, setDeleteAddr] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form fields based on task or selection
  useEffect(() => {
    setFormError(null);
    if (modalType === 'CREATE_NODE') {
      let defData = activeTask.defaultInputValues?.data !== undefined ? String(activeTask.defaultInputValues.data) : '';
      if (activeTask.id === 'L1_T1') {
        if (nodes.some((n) => n.data === 10)) {
          defData = '20';
        } else {
          defData = '10';
        }
      }
      const defAddr = String(defaultAddr);
      const defNext = 'NULL';
      setDataInput(defData);
      setAddressInput(defAddr);
      setNextInput(defNext);
    } else if (modalType === 'CHANGE_NEXT') {
      const initialTarget = selectedAddress || (nodes.length > 0 ? nodes[0].address : null);
      setTargetNodeAddr(initialTarget);
      if (initialTarget !== null) {
        const found = nodes.find((n) => n.address === initialTarget);
        setNewNextInput(found?.nextAddress !== null && found?.nextAddress !== undefined ? String(found.nextAddress) : 'NULL');
      }
    } else if (modalType === 'SET_HEAD') {
      const val = activeTask.defaultInputValues?.head !== undefined ? String(activeTask.defaultInputValues.head) : (pointers.headAddress !== null ? String(pointers.headAddress) : 'NULL');
      setHeadInput(val);
    } else if (modalType === 'SET_TAIL') {
      const val = activeTask.defaultInputValues?.tail !== undefined ? String(activeTask.defaultInputValues.tail) : (pointers.tailAddress !== null ? String(pointers.tailAddress) : 'NULL');
      setTailInput(val);
    } else if (modalType === 'DELETE_NODE') {
      setDeleteAddr(selectedAddress || (nodes.length > 0 ? nodes[0].address : null));
    }
  }, [modalType, activeTask, selectedAddress, nodes.length]);

  if (modalType === 'NONE') return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const dataNum = parseInt(dataInput, 10);
    const addrNum = parseInt(addressInput, 10);

    if (isNaN(dataNum)) {
      setFormError('Please enter a valid numeric DATA value.');
      return;
    }
    if (isNaN(addrNum) || addrNum <= 0) {
      setFormError('Please enter a valid positive memory address (e.g. 1001, 1002).');
      return;
    }
    if (nodes.some((n) => n.address === addrNum)) {
      setFormError(`Memory collision! Address ${addrNum} is already occupied by another node.`);
      return;
    }

    let nextVal: number | null = null;
    if (nextInput.trim().toUpperCase() !== 'NULL' && nextInput.trim() !== '') {
      const parsedNext = parseInt(nextInput, 10);
      if (isNaN(parsedNext)) {
        setFormError('NEXT pointer must be a valid numeric address or "NULL".');
        return;
      }
      nextVal = parsedNext;
    }

    onCreateNode(dataNum, addrNum, nextVal);
    onClose();
  };

  const handleChangeNextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (targetNodeAddr === null) {
      setFormError('Please select a node to update.');
      return;
    }

    let nextVal: number | null = null;
    if (newNextInput.trim().toUpperCase() !== 'NULL' && newNextInput.trim() !== '') {
      const parsedNext = parseInt(newNextInput, 10);
      if (isNaN(parsedNext)) {
        setFormError('NEXT must be a valid numeric address or "NULL".');
        return;
      }
      nextVal = parsedNext;
    }

    onChangeNext(targetNodeAddr, nextVal);
    onClose();
  };

  const handleSetHeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let headVal: number | null = null;
    if (headInput.trim().toUpperCase() !== 'NULL' && headInput.trim() !== '') {
      const parsed = parseInt(headInput, 10);
      if (isNaN(parsed)) {
        setFormError('HEAD must be a numeric address or "NULL".');
        return;
      }
      headVal = parsed;
    }
    onSetHead(headVal);
    onClose();
  };

  const handleSetTailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let tailVal: number | null = null;
    if (tailInput.trim().toUpperCase() !== 'NULL' && tailInput.trim() !== '') {
      const parsed = parseInt(tailInput, 10);
      if (isNaN(parsed)) {
        setFormError('TAIL must be a numeric address or "NULL".');
        return;
      }
      tailVal = parsed;
    }
    onSetTail(tailVal);
    onClose();
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodes.length === 0) {
      setFormError('Cannot delete. The linked list is empty (Underflow).');
      return;
    }
    if (deleteAddr === null) {
      setFormError('Please select a node to delete.');
      return;
    }
    onDeleteNode(deleteAddr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-blue-900/40 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-blue-900/20 flex items-center justify-between bg-slate-50/70 dark:bg-[#15203B]">
          <div className="flex items-center gap-2.5">
            {modalType === 'CREATE_NODE' && (
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
            )}
            {modalType === 'CHANGE_NEXT' && (
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 flex items-center justify-center">
                <LinkIcon className="w-4 h-4" />
              </div>
            )}
            {modalType === 'SET_HEAD' && (
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 flex items-center justify-center font-bold font-mono text-xs">
                HEAD
              </div>
            )}
            {modalType === 'SET_TAIL' && (
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold font-mono text-xs">
                TAIL
              </div>
            )}
            {modalType === 'DELETE_NODE' && (
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
            )}
            {modalType === 'HINT' && (
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {modalType === 'CREATE_NODE' && 'Allocate & Create Node'}
                {modalType === 'CHANGE_NEXT' && 'Modify NEXT Pointer'}
                {modalType === 'SET_HEAD' && 'Set HEAD Pointer'}
                {modalType === 'SET_TAIL' && 'Set TAIL Pointer'}
                {modalType === 'DELETE_NODE' && 'Deallocate / Delete Node'}
                {modalType === 'HINT' && 'Interactive 3-Tier Hint'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {modalType === 'CREATE_NODE' && 'Allocate Heap RAM memory for a new node'}
                {modalType === 'CHANGE_NEXT' && 'Rewire successor memory address link'}
                {modalType === 'SET_HEAD' && 'Update address of first node in list'}
                {modalType === 'SET_TAIL' && 'Update address of last node in list'}
                {modalType === 'DELETE_NODE' && 'Free memory allocated to a node (free(node))'}
                {modalType === 'HINT' && 'Progressive hints without giving away the exact answer'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* CREATE NODE FORM */}
          {modalType === 'CREATE_NODE' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1. DATA Value (Integer)
                </label>
                <input
                  type="number"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder="e.g. 10, 20, 30"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. Memory Address (Heap RAM Location)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="e.g. 1001, 1002"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAddressInput(String(defaultAddr))}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-blue-950/60 border border-slate-200 dark:border-blue-900/30 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Auto ({defaultAddr})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  3. NEXT Pointer (Address or NULL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nextInput}
                    onChange={(e) => setNextInput(e.target.value)}
                    placeholder="e.g. 1002 or NULL"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNextInput('NULL')}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                  >
                    NULL
                  </button>
                </div>
              </div>

              {/* Quick Node Addresses Pills */}
              {nodes.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">
                    Existing Node Addresses:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {nodes.map((n) => (
                      <button
                        key={n.address}
                        type="button"
                        onClick={() => setNextInput(String(n.address))}
                        className="px-2 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-500/30 text-[11px] font-mono font-semibold text-[#2563EB] dark:text-blue-300 hover:bg-[#DBEAFE]"
                      >
                        {n.address} [Data:{n.data}]
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Allocate Node</span>
                </button>
              </div>
            </form>
          )}

          {/* CHANGE NEXT POINTER FORM */}
          {modalType === 'CHANGE_NEXT' && (
            <form onSubmit={handleChangeNextSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1. Select Node to Modify
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {nodes.map((n) => (
                    <button
                      key={n.address}
                      type="button"
                      onClick={() => {
                        setTargetNodeAddr(n.address);
                        setNewNextInput(n.nextAddress !== null ? String(n.nextAddress) : 'NULL');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        targetNodeAddr === n.address
                          ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 font-bold ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-blue-900/30 bg-slate-50/50 dark:bg-[#070B19] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">ADDR: {n.address}</span>
                        <span className="text-xs font-bold">DATA: {n.data}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-blue-900/20">
                        → {n.nextAddress !== null ? n.nextAddress : 'NULL'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. Enter New NEXT Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNextInput}
                    onChange={(e) => setNewNextInput(e.target.value)}
                    placeholder="e.g. 1002 or NULL"
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewNextInput('NULL')}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                  >
                    NULL
                  </button>
                </div>
              </div>

              {/* Quick Node Addresses Pills */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">
                  Target Address Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nodes
                    .filter((n) => n.address !== targetNodeAddr)
                    .map((n) => (
                      <button
                        key={n.address}
                        type="button"
                        onClick={() => setNewNextInput(String(n.address))}
                        className="px-2 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-900/30 text-[11px] font-mono font-semibold text-[#2563EB] dark:text-blue-300 hover:bg-[#DBEAFE]"
                      >
                        Node {n.address} [Data:{n.data}]
                      </button>
                    ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#2563EB] to-[#6366F1] hover:from-[#1D4ED8] hover:to-[#4F46E5] text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Update NEXT</span>
                </button>
              </div>
            </form>
          )}

          {/* SET HEAD FORM */}
          {modalType === 'SET_HEAD' && (
            <form onSubmit={handleSetHeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  HEAD Memory Address
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Enter the memory address of the first node, or "NULL" if the list is empty.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={headInput}
                    onChange={(e) => setHeadInput(e.target.value)}
                    placeholder="e.g. 1001 or NULL"
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setHeadInput('NULL')}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                  >
                    NULL
                  </button>
                </div>
              </div>

              {/* Quick Node Addresses Pills */}
              {nodes.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">
                    Pick Node Address:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {nodes.map((n) => (
                      <button
                        key={n.address}
                        type="button"
                        onClick={() => setHeadInput(String(n.address))}
                        className="px-2 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE] dark:border-blue-500/30 text-[11px] font-mono font-semibold text-[#2563EB] dark:text-blue-300 hover:bg-[#DBEAFE]"
                      >
                        {n.address} [Data: {n.data}]
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Set HEAD</span>
                </button>
              </div>
            </form>
          )}

          {/* SET TAIL FORM */}
          {modalType === 'SET_TAIL' && (
            <form onSubmit={handleSetTailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  TAIL Memory Address
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Enter the memory address of the last node (whose NEXT is NULL), or "NULL".
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tailInput}
                    onChange={(e) => setTailInput(e.target.value)}
                    placeholder="e.g. 1004 or NULL"
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/30 bg-slate-50 dark:bg-[#070B19] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTailInput('NULL')}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                  >
                    NULL
                  </button>
                </div>
              </div>

              {/* Quick Node Addresses Pills */}
              {nodes.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold block mb-1">
                    Pick Node Address:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {nodes.map((n) => (
                      <button
                        key={n.address}
                        type="button"
                        onClick={() => setTailInput(String(n.address))}
                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/30 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                      >
                        {n.address} [Data: {n.data}]
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Set TAIL</span>
                </button>
              </div>
            </form>
          )}

          {/* DELETE NODE FORM */}
          {modalType === 'DELETE_NODE' && (
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              {nodes.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Underflow Guard Triggered</span>
                  </div>
                  <p>Cannot delete a node from an empty linked list. HEAD is currently NULL.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Select Node to Free Memory:
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {nodes.map((n) => (
                      <button
                        key={n.address}
                        type="button"
                        onClick={() => setDeleteAddr(n.address)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          deleteAddr === n.address
                            ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold ring-2 ring-rose-500/30'
                            : 'border-slate-200 dark:border-blue-900/30 bg-slate-50/50 dark:bg-[#070B19] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">ADDR: {n.address}</span>
                        <span className="text-xs font-bold">DATA: {n.data}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nodes.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Free(Node)</span>
                </button>
              </div>
            </form>
          )}

          {/* 3-TIER HINT */}
          {modalType === 'HINT' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {activeTask.hints.map((hint, idx) => {
                  const isUnlocked = idx <= hintLevel;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isUnlocked
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-50 dark:bg-[#070B19] border-dashed border-slate-200 dark:border-blue-900/20 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Tier {idx + 1}: {idx === 0 ? 'Core Concept' : idx === 1 ? 'Pointer & Memory Logic' : 'Exact Action Rule'}</span>
                        </span>
                        {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      {isUnlocked ? (
                        <p className="text-xs font-medium leading-relaxed">{hint}</p>
                      ) : (
                        <p className="text-xs font-mono text-slate-400 dark:text-slate-600 italic">
                          Locked. Click "Next Hint Tier" below to reveal.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                {hintLevel < 2 && (
                  <button
                    type="button"
                    onClick={onAdvanceHint}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Reveal Tier {hintLevel + 2} Hint</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
