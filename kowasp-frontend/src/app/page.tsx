export const runtime = "edge"; // cloudflare pages

export default async function Home() {
  //const backendUrl = "http://localhost:3001";
  
  //const res = await fetch(`${backendUrl}`, {
    //method: "GET",
  //})
    //.then((response) => {
      //if (!response.ok) {
        //throw new Error("Network response was not ok");
      //}
      //return response.json();
    //})
    //.then((data) => {
      //console.log("Backend is up and running!", data);
      //return data;
    //})
    //.catch((error) => {
      //console.error("Error fetching data:", error);
    //});
  //console.log(res);

  return (
    <> 
      <main className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <h1 className="text-white bold text-6xl">KOwasp</h1>
          <p className="text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)] mb-2">
            a solution to all owasp top 10 vulnerabilities
          </p>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <a
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
              href="https://www.github.com/kowasp/kowasp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our docs
            </a>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex items-center justify-center">
      Building... Stay tuned!
      </footer>
    </>
  );
}
