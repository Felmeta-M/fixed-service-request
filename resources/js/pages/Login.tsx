export default function Login() {
    const start = async () => {
        const res = await fetch("/login/esignet");
        const data = await res.json();
        console.log("🚀 ~ start ~ data:", data)
        window.location.href = data.authUrl;
    };

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h1>Test eSignet Login</h1>
            <button onClick={start}>Login with eSignet</button>
        </div>
    );
}
