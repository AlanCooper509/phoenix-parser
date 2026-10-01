import "./OverviewStats.css";

function Titles({titles}) {
    return (
        <div className="title-stat-item container py-3 rounded d-flex align-items-center justify-content-between">
            <h5 className="stat-description mb-0">Titles Achieved:</h5>
            <h5 className="mb-0">{titles.length}</h5>
        </div>
    );
}

export default Titles;