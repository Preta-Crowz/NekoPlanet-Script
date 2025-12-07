<script>
    export let farms;

    let crops = [];
    for (const cropList of farms) {
        for (const tile of cropList.crops) {
            if (tile.data["crop:name"] !== undefined) {
                crops.push(tile);
            }
        }
    }
    crops.sort((a, b) => {
        if (a.data["crop:tier"] < b.data["crop:tier"]) return 1;
        if (a.data["crop:tier"] > b.data["crop:tier"]) return -1;
        if (a.data["crop:name"] < b.data["crop:name"]) return -1;
        if (a.data["crop:name"] > b.data["crop:name"]) return 1;
        let growthFactorA = a.data["crop:growth"] + a.data["crop:gain"] - a.data["crop:resistance"];
        let growthFactorB = b.data["crop:growth"] + b.data["crop:gain"] - b.data["crop:resistance"];

        if (growthFactorA < growthFactorB) return -1;
        if (growthFactorA > growthFactorB) return 1;

        return 0;
    });

    let search = "";

    let shownList = [];
    $: shownList = crops.filter(crop => crop.data["crop:name"].toLowerCase().includes(search.toLowerCase()));


</script>

<div class="stored-crops">
    <input type="text" placeholder="Search crops..." bind:value={search} />
    <ul class="scrollable-list">
        {#each shownList as crop}
            <li>
                <span> {crop.data["crop:name"]} </span>
                <span> Tier {crop.data["crop:tier"]} </span>
                <span> {crop.data["crop:growth"]} / {crop.data["crop:gain"]} / {crop.data["crop:resistance"]} </span>
            </li>
        {/each}
    </ul>
</div>
<style>
    .stored-crops {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .scrollable-list {
        overflow-y: auto;
        padding: 0;
        margin: 0;
        list-style: none;
        height: 100%;
    }

    .scrollable-list li {
        padding: 0.5rem;
        border-bottom: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
    }

    .scrollable-list li:nth-child(odd) {
        background-color: #f9f9f9;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        box-sizing: border-box;
    }
</style>