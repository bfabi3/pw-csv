import { useState, useMemo } from "react";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
    const [rawData, setRawData] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [sort, setSort] = useState({ column: null, direction: null });
    const [page, setPage] = useState(1);
    const [headers, setHeaders] = useState([]);

    const rowsPerPage = 100;

    // --------------------------
    // Handle CSV Upload
    // --------------------------
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                setRawData(result.data);
                setHeaders(result.meta.fields); // Get CSV columns dynamically
                setColumnFilters({});
                setPage(1);
                setSort({ column: null, direction: null });
                console.log("CSV Loaded:", result.data.length, "rows");
            },
        });
    };

    // --------------------------
    // Column Filters
    // --------------------------
    const filteredData = useMemo(() => {
        return rawData.filter((row) =>
            Object.entries(columnFilters).every(([col, value]) => {
                if (!value) return true;
                return String(row[col] ?? "")
                    .toLowerCase()
                    .includes(value.toLowerCase());
            })
        );
    }, [rawData, columnFilters]);

    // --------------------------
    // Sorting
    // --------------------------
    const sortedData = useMemo(() => {
        if (!sort.column) return filteredData;

        return [...filteredData].sort((a, b) => {
            const av = a[sort.column];
            const bv = b[sort.column];

            if (!isNaN(av) && !isNaN(bv)) {
                return sort.direction === "asc"
                    ? Number(av) - Number(bv)
                    : Number(bv) - Number(av);
            }

            return sort.direction === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
    }, [filteredData, sort]);

    // --------------------------
    // Pagination
    // --------------------------
    const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
    const start = (page - 1) * rowsPerPage;
    const paginatedRows = sortedData.slice(start, start + rowsPerPage);

    if (page > totalPages) setPage(1);

    // --------------------------
    // Export CSV
    // --------------------------
    const exportCSV = () => {
        if (!sortedData.length) return;
        const csv = Papa.unparse(sortedData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "export.csv";
        a.click();
    };

    // --------------------------
    // Sorting toggle
    // --------------------------
    const toggleSort = (col) => {
        setSort((prev) => {
            if (prev.column !== col) return { column: col, direction: "asc" };
            if (prev.direction === "asc") return { column: col, direction: "desc" };
            return { column: null, direction: null };
        });
    };

    // --------------------------
    // UI
    // --------------------------
    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="fw-bold">Poring World CSV Viewer</h2>

                <div className="d-flex gap-2">
                    <label className="btn btn-primary mb-0">
                        Upload CSV
                        <input
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={handleFileUpload}
                        />
                    </label>

                    <button className="btn btn-success" onClick={exportCSV}>
                        Export Filtered CSV
                    </button>
                </div>
            </div>




            {/* Summary label */}
            <div className="mb-2 text-muted">
                Showing <strong>{paginatedRows.length}</strong> of{" "}
                <strong>{sortedData.length}</strong> filtered rows
                (Total loaded: <strong>{rawData.length}</strong>)
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    onClick={() => toggleSort(header)}
                                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                    {header.replace(/_/g, " ").toUpperCase()}
                                    {sort.column === header &&
                                        (sort.direction === "asc" ? " ▲" : " ▼")}
                                </th>
                            ))}
                        </tr>

                        {/* Filter row */}
                        <tr className="table-light">
                            {headers.map((header) => (
                                <th key={header}>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="Filter..."
                                        value={columnFilters[header] || ""}
                                        onChange={(e) =>
                                            setColumnFilters({
                                                ...columnFilters,
                                                [header]: e.target.value,
                                            })
                                        }
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row, i) => (
                                <tr key={i}>
                                    {headers.map((col) => (
                                        <td key={col}>{row[col]}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={headers.length} className="text-center py-4">
                                    No results.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
                <button
                    className="btn btn-secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Prev
                </button>

                <span>
                    Page <strong>{page}</strong> / <strong>{totalPages}</strong>
                </span>

                <button
                    className="btn btn-secondary"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
