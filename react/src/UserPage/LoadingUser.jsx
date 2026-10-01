import './LoadingUser.css';

function LoadingUser({name, hashNum}) {
    return (
        <div className="container">
            <div className="row align-items-center justify-content-center">
                <div className="loading">
                    Now Loading <span className="identity">{name} {hashNum}</span>...
                    <span className="ms-3 me-3 mb-1 spinner-border spinner-border-sm" role="status">
                        <span className="sr-only"></span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LoadingUser