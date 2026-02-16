<script>
    export let tile;
    export let x; 
    export let y;

    export let details;

    console.log(tile);
</script>



<button class="tile" class:breed={(x+y)%2 === 1} class:source={(x+y)%2 === 0} class:grayout={tile.data["crop:name"] === undefined} aria-label={"Tile " + (x) + "," + (y)} on:click={() => details = {x, y, tile}}>
    {#if tile.data["crop:name"] !== undefined}
        <span> {tile.data["crop:name"]}</span>
        <span> Tier {tile.data["crop:tier"]}</span>
        <span> {tile.data["crop:growth"]} / {tile.data["crop:gain"]} / {tile.data["crop:resistance"]}</span>
    {:else if tile["canPlant"] === false}
        <span> Locked </span>
    {:else if tile.data["name"] !== "IC2:blockCrop"}
        <span> {tile.data["name"]} </span>
   
    {:else}
        <span> Empty </span> 
    {/if}
</button>

<style>
    .tile {
        width: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* background: linear-gradient(180deg, #f7fff7, #e6f6e6); */
        border: 1px solid #cfe9cf;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.7rem;
        padding: 0;
    }
    .breed {
        background:  #fff7f7;
    }
    .source {
        background:  #f7fff7;
    }
    .grayout {
        background: lightgrey;
    }
</style>