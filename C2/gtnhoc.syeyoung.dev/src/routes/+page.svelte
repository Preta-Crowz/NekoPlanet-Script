
<!-- Write 9x9 grid to show crops with flexb ox-->
<script>
    import { onMount } from "svelte";
    import Crop from "$lib/Crop.svelte";
    import StoredCrops from "$lib/StoredCrops.svelte";
    import TileDetails from "$lib/TileDetails.svelte";


    let details = undefined;

    const SIZE = 9;
    const TOTAL = SIZE * SIZE;
    let tiles = [];
    let storedCrops = [];

    // refresh tiles, stored Crops every 5 second
    setInterval(() => {
        fetch('https://gtnhoc.syeyoung.dev/api/farms')
            .then(res => res.json())
            .then(farmsData => {
                tiles = farmsData.workingFarm.crops;
                storedCrops = farmsData.storageFarm;
            });
    }, 5000);

    onMount(() => {
        fetch('https://gtnhoc.syeyoung.dev/api/farms')
                .then(res => res.json())
                .then(farmsData => {
                    tiles = farmsData.workingFarm.crops;
                    storedCrops = farmsData.storageFarm;
                });
    });
</script>

<div class="page">
    <div class="header">
        <h1>NekoPlanet Crop Breeding</h1>
    </div>
    <div class="content">
        <div class="column">
            <div class="grid" role="grid" aria-label="9 by 9 crop grid">
                {#each tiles as tile, i}
                    <div class="cell" role="gridcell">
                        <Crop {tile} x={i % SIZE} y={Math.floor(i / SIZE)} bind:details/>
                    </div>
                {/each}
            </div>

            <p>Min Tier: {Math.min(...tiles.filter((t, i) => (((i % SIZE) + Math.floor(i / SIZE)) % 2) === 0 && t.data["crop:tier"]).map(t => t.data["crop:tier"]))}</p>
            <p>Max Tier: {Math.max(...tiles.filter((t, i) => (((i % SIZE) + Math.floor(i / SIZE)) % 2) === 0 && t.data["crop:tier"]).map(t => t.data["crop:tier"]))}</p>
            <p>Min Growth+Gain-Resistance: {Math.min(...tiles.filter((t, i) => (((i % SIZE) + Math.floor(i / SIZE)) % 2) === 0 && t.data["crop:tier"]).map(t => t.data["crop:growth"] + t.data["crop:gain"] - t.data["crop:resistance"]))}</p>
            <p>Max Growth+Gain-Resistance: {Math.max(...tiles.filter((t, i) => (((i % SIZE) + Math.floor(i / SIZE)) % 2) === 0 && t.data["crop:tier"]).map(t => t.data["crop:growth"] + t.data["crop:gain"] - t.data["crop:resistance"]))}</p>
        </div>
        <div class="column">
            <TileDetails {details} />
        </div>
        <div class="column">
            <h1>Stored Crops</h1>
            <StoredCrops farms={storedCrops}/>
        </div>
    </div>
</div>



<style>
    .page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        flex-grow: 1;
        width: 100%;
        height: 100%;
    }
    .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-width: 720px;
        margin: 1rem 0;
    }

    .cell {
        width: calc((100% - 8 * 6px) / 9);
        box-sizing: border-box;
    }

    .content {
        display: flex;
        flex-grow: 1;
        width: 100%;
        height: 100%;
    }

    .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: first;
        border: 1px solid #ccc;
        padding: 1rem;
        flex-grow: 1;
        height: 100%;
        max-height: 100%;
    }
</style>