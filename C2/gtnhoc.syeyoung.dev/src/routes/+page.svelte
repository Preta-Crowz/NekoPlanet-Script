
<!-- Write 9x9 grid to show crops with flexb ox-->
<script>
    import Crop from "$lib/Crop.svelte";
    import TileDetails from "$lib/TileDetails.svelte";

    export let data;

    let details = undefined;

    const SIZE = 9;
    const TOTAL = SIZE * SIZE;
    console.log(data.farms)
    console.log(data.farms.workingFarm)
    let tiles = data.farms.workingFarm.crops;

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
        </div>
        <div class="column">
            <TileDetails {details} />
        </div>
        <div class="column">
            <h1>Stored Crops</h1>
        </div>
    </div>
</div>



<style>
    .page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        flex: 1;
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
        flex: 1;
        width: 100%;
    }

    .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: first;
        border: 1px solid #ccc;
        padding: 1rem;
    }
</style>