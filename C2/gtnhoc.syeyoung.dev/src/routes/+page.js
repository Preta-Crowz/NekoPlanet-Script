

export async function load({ fetch, url }) {
    return {
        farms: await fetch(`https://gtnhoc.syeyoung.dev/api/farms`).then(res => res.json())
    };
}