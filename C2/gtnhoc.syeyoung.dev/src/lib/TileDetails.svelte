<script>
    export let details;
</script>

<div>
    <h1> Details </h1>
    {#if details === undefined}
        <span> No tile selected </span>
    {:else}
        <table>
            <tbody>
                <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>X</td>
                    <td>{details.x}</td>
                </tr>
                <tr>
                    <td>Y</td>
                    <td>{details.y}</td>
                </tr>
                <tr>
                    <td>IsDouble</td>
                    <td>{details.tile.isDouble}</td>
                </tr>
                <tr>
                    <td>CanPlant</td>
                    <td>{details.tile.canPlant}</td>
                </tr>
                <tr>
                    <td>LastChecked</td>
                    <td>{details.tile.lastChecked}</td>
                </tr>
                {#each Object.entries(details.tile.data) as [key, value]}
                    <tr>
                        <td>{key}</td>
                        <td>{value}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>