import React from 'react';

/**
 * Professional, reusable table component
 *
 * Usage:
 * <Table headers={['Name', 'Email', 'Role']}>
 *   {rows.map(row => (
 *     <tr key={row.id}>
 *       <Table.Cell>{row.name}</Table.Cell>
 *       <Table.Cell>{row.email}</Table.Cell>
 *       <Table.Cell align="right">{row.role}</Table.Cell>
 *     </tr>
 *   ))}
 * </Table>
 */
const Table = ({
    headers = [],
    children,
    dense = false,
    striped = true,
    headerSticky = true,
    className = '',
}) => {
    const cellPadding = dense ? 'px-4 py-2.5' : 'px-6 py-3';

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
            <div className="table-container custom-scrollbar">
                <table className="table-responsive text-left text-sm text-gray-800">
                    <thead
                        className={`bg-gray-50 border-b border-gray-200 ${headerSticky ? 'sticky top-0 z-10' : ''
                            }`}
                    >
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className={`${cellPadding} font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody
                        className={`divide-y divide-gray-100 ${striped ? 'bg-white [&>tr:nth-child(even)]:bg-gray-50/60' : ''
                            }`}
                    >
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TableCell = ({ children, align = 'left', className = '' }) => {
    const alignClass =
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    return (
        <td
            className={`px-6 py-3 align-middle text-sm text-gray-700 ${alignClass} ${className}`.trim()}
        >
            {children}
        </td>
    );
};

Table.Cell = TableCell;

export default Table;
