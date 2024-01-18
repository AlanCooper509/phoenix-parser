import SearchUser from "../SearchUser/SearchUser";

function LaunchPage() {
    return (
        <div className="container mt-4">
            <SearchUser
                open={true}
            />
            <h3>Welcome!</h3>
            <h5 className="ms-4 mt-3">Search for a USER to get started</h5>
        </div>
    );
}

export default LaunchPage;