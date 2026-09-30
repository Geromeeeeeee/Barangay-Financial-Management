import useRevenue from "../custom_hooks/use_revenue";

export default function Dashboard () {
    const { revenues, loading, error, refetch } = useRevenue();

    return (
        <main>
            <h1>Dashboard</h1>
            <button type="button" onClick={refetch} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh revenue'}
            </button>

            {loading && <p>Loading revenue...</p>}
            {!loading && error && <p role="alert">{error}</p>}
            {!loading && !error && revenues.length === 0 && (
                <p>No revenue records found.</p>
            )}

            {!loading && !error && revenues.length > 0 && (
                <ul>
                    {revenues.map((revenue, index) => (
                        <li key={revenue.id ?? revenue.revenue_id ?? index}>
                            <strong>
                                {revenue.source ?? revenue.description ?? 'Unnamed revenue'}
                            </strong>
                            {' - '}
                            {revenue.amount ?? '0'}
                            {' ('}
                            {revenue.fund_allocation ?? revenue.fundAllocation ?? 'General'}
                            {')'}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}