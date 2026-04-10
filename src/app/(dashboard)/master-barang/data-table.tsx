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

// 1. Import Types langsung dari Prisma Client
import { Barang, Kategori } from "@prisma/client"

// 2. Buat custom Type gabungan Barang dan relasi Kategori
export type BarangWithKategori = Barang & {
  kategori: Kategori | null;
};

// 3. Ganti "any[]" menjadi tipe data yang sudah kita buat
export function DataTable({ data }: { data: BarangWithKategori[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // 4. Update generic pada ColumnDef
  const columns: ColumnDef<BarangWithKategori>[] = [
    {
      accessorKey: "kode_barang",
      header: "Kode",
      cell: ({ row }) => <span className="font-semibold text-indigo-600">{row.original.kode_barang}</span>,
    },
    {
      accessorKey: "nama_barang",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 hover:text-indigo-600 font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Barang
            <ArrowUpDown className="w-4 h-4" />
          </button>
        )
      },
    },
    {
      accessorKey: "kategori.nama",
      header: "Kategori",
      cell: ({ row }) => (
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200 font-medium">
          {row.original.kategori?.nama || "-"}
        </span>
      ),
    },
    {
      accessorKey: "stok",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 hover:text-indigo-600 font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stok
            <ArrowUpDown className="w-4 h-4" />
          </button>
        )
      },
      cell: ({ row }) => {
        const stok = row.original.stok
        return (
          <span className={`font-bold ${stok < 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
            {stok}
          </span>
        )
      },
    },
    {
      accessorKey: "satuan",
      header: "Satuan",
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
      {/* Fitur Search */}
      <div className="flex items-center gap-2 max-w-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          placeholder="Cari nama atau kode barang..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none text-slate-700 placeholder:text-slate-400 text-sm"
        />
      </div>

      {/* Tabel Data */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
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

      {/* Pagination Controls */}
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