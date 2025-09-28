import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import { useMemo, useState } from "react";

export type Column<T> = {
  id: keyof T | string;
  label: string;
  align?: 'left'|'right'|'center';
  width?: number | string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

export default function DataTable<T extends Record<string, any>>({ columns, rows, initialSort, pageSize=20, onRowClick }:{
  columns: ReadonlyArray<Column<T>>;
  rows: ReadonlyArray<T>;
  initialSort?: { by: string; dir: 'asc'|'desc' };
  pageSize?: number;
  onRowClick?: (row: T)=>void;
}) {
  const [sortBy, setSortBy] = useState(initialSort?.by || String(columns[0]?.id || ''));
  const [sortDir, setSortDir] = useState<'asc'|'desc'>(initialSort?.dir || 'asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const sorted = useMemo(()=>{
    const arr = [...rows];
    if (!sortBy) return arr;
    return arr.sort((a:any,b:any)=>{
      const av = (a?.[sortBy] ?? '').toString().toLowerCase();
      const bv = (b?.[sortBy] ?? '').toString().toLowerCase();
      if (av < bv) return sortDir==='asc' ? -1 : 1;
      if (av > bv) return sortDir==='asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortBy, sortDir]);

  const paged = useMemo(()=>{
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={String(col.id)} align={col.align} style={{ width: col.width }}>
                {col.sortable !== false ? (
                  <TableSortLabel
                    active={sortBy === col.id}
                    direction={sortBy === col.id ? sortDir : 'asc'}
                    onClick={()=>{ setSortBy(String(col.id)); setSortDir(sortDir==='asc'?'desc':'asc'); }}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((row, idx) => (
            <TableRow key={(row as any).name || idx} hover sx={{ cursor: onRowClick ? 'pointer' : 'default' }} onClick={()=> onRowClick?.(row)}>
              {columns.map(col => (
                <TableCell key={String(col.id)} align={col.align}>
                  {col.render ? col.render(row) : (row as any)[col.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_,p)=> setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e)=> { setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }}
      />
    </>
  );
}

