/** Reserved server boundary for phase 2. The demo never makes paid API calls. */
export async function POST() {
 return Response.json({error:'Live AI is not enabled in this demo. Use demo mode; the LLM and vector databases will be connected in phase 2.'}, {status:503,headers:{'Cache-Control':'no-store'}});
}
