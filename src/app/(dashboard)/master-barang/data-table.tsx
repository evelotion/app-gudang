"use client"

import { useState } from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

// Import murni Barang dari Prisma Client
import { Barang } from "@prisma/client"

export function DataTable({ data }: { data: Barang[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns: ColumnDef<Barang>[] = [
    {
      accessorKey: "kode_barang",
      header: "Kode",
      cell: ({ row }) => <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs">{row.original.kode_barang}</span>,
    },
    {
      accessorKey: "nama_barang",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 hover:text-indigo-600 font-bold transition-colors uppercase text-xs tracking-wider"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Barang
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        )
      },
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.nama_barang}</span>,
    },
    {
      accessorKey: "nomorator",
      header: "Nomorator",
      cell: ({ row }) => <span className="text-xs font-mono text-slate-500">{row.original.nomorator || "-"}</span>,
    },
    {
      accessorKey: "stok",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 hover:text-indigo-600 font-bold transition-colors uppercase text-xs tracking-wider"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stok Asli
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        )
      },
      cell: ({ row }) => {
        const stok = row.original.stok
        const stokMin = row.original.stok_min
        const isWarning = stok <= stokMin
        
        return (
          <div className="flex flex-col">
             <span className={`font-bold text-base ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
               {stok} <span className="text-xs font-normal">{row.original.satuan}</span>
             </span>
             {isWarning && <span className="text-[10px] text-rose-500 font-medium">Batas Min: {stokMin}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "harga_satuan",
      header: "Harga Satuan",
      cell: ({ row }) => {
        const harga = row.original.harga_satuan;
        return <span className="font-medium text-slate-700">Rp {harga.toLocaleString('id-ID')}</span>
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => <span className="text-xs text-slate-500 truncate max-w-[150px] inline-block" title={row.original.supplier || ""}>{row.original.supplier || "-"}</span>,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          placeholder="Cari nama atau kode barang..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none text-slate-700 placeholder:text-slate-400 text-sm"
        />
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada barang yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500 font-medium">
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}