const FAV_MOVIE = "Jennifer's Body";

const COLORS = {
    green: "#096c69",
    greenMedium: "#1c9b86",
    greenLight: "#c1e6e2",
    white: "#ffffff",
    black: "#111111"
};

function toNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(
        String(value).replace(/,/g, "")
    );

    return Number.isFinite(number) ? number : null;
}


function median(values) {
    if (!values.length) {
        return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
        return sorted[middle];
    }

    return (sorted[middle - 1] + sorted[middle]) / 2;
}


function formatNumber(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }

    return Number.isInteger(value)
        ? String(value)
        : value.toFixed(2);
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

Papa.parse("rotten_tomatoes_movies.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {
        try {
            analyzeData(results.data);
        } catch (error) {
            console.error("Data analysis error:", error);

            document.querySelector(".loading").textContent =
                "There was a problem analyzing the movie data.";
        }
    },

    error: function (error) {
        console.error("CSV loading error:", error);

        document.querySelector(".loading").textContent =
            "The CSV file could not be loaded. Make sure rotten_tomatoes_movies.csv is in the same folder as index.html.";
    }
});

function analyzeData(movieData) {

    const favMovieData = movieData.filter(
        row => row.movie_title === FAV_MOVIE
    );

    const horrorMovieData = movieData.filter(
        row =>
            String(row.genres ?? "")
                .toLowerCase()
                .includes("horror")
    );

    const audienceRatings = horrorMovieData
        .map(row => toNumber(row.audience_rating))
        .filter(value => value !== null);

    if (!audienceRatings.length) {
        document.getElementById("movieCount").textContent =
            horrorMovieData.length;

        document.getElementById("minRating").textContent = "N/A";
        document.getElementById("maxRating").textContent = "N/A";
        document.getElementById("meanRating").textContent = "N/A";
        document.getElementById("medianRating").textContent = "N/A";

        renderFavoriteMovieTable(favMovieData);

        document.getElementById("comparisonText").innerHTML =
            "<p>No valid audience ratings were found for horror movies.</p>";

        return;
    }

    const minRating = Math.min(...audienceRatings);
    const maxRating = Math.max(...audienceRatings);

    const meanRating =
        audienceRatings.reduce(
            (sum, value) => sum + value,
            0
        ) / audienceRatings.length;

    const medianRating = median(audienceRatings);

    document.getElementById("movieCount").textContent =
        horrorMovieData.length;

    document.getElementById("minRating").textContent =
        formatNumber(minRating);

    document.getElementById("maxRating").textContent =
        formatNumber(maxRating);

    document.getElementById("meanRating").textContent =
        formatNumber(meanRating);

    document.getElementById("medianRating").textContent =
        formatNumber(medianRating);

    renderFavoriteMovieTable(favMovieData);

    renderComparison(
        favMovieData,
        minRating,
        maxRating,
        meanRating,
        medianRating
    );

    renderHistogram(audienceRatings);

    renderScatterplot(horrorMovieData);
}


function renderFavoriteMovieTable(rows) {

    const container =
        document.getElementById("favoriteMovieTable");

    if (!rows.length) {
        container.innerHTML =
            "<p>Jennifer's Body was not found in the dataset.</p>";
        return;
    }

    const columns = Object.keys(rows[0]);

    let html = "<table>";
    html += "<thead><tr>";

    columns.forEach(column => {
        html += `<th>${escapeHTML(column)}</th>`;
    });

    html += "</tr></thead>";
    html += "<tbody>";

    rows.forEach(row => {

        html += "<tr>";

        columns.forEach(column => {
            html += `
                <td>
                    ${escapeHTML(row[column])}
                </td>
            `;
        });

        html += "</tr>";
    });

    html += "</tbody></table>";

    container.innerHTML = html;
}

function renderComparison(
    favMovieData,
    minRating,
    maxRating,
    meanRating,
    medianRating
) {

    const container =
        document.getElementById("comparisonText");

    if (!favMovieData.length) {
        container.innerHTML =
            "<p>Jennifer's Body was not found in the dataset.</p>";
        return;
    }

    const favRating =
        toNumber(favMovieData[0].audience_rating);

    if (favRating === null) {
        container.innerHTML =
            "<p>The audience rating for Jennifer's Body is unavailable.</p>";
        return;
    }

    const differenceFromMin =
        favRating - minRating;

    const differenceFromMax =
        maxRating - favRating;

    const differenceFromMean =
        Math.abs(favRating - meanRating);

    const differenceFromMedian =
        Math.abs(favRating - medianRating);


    const meanDirection =
        favRating >= meanRating ? "above" : "below";

    const medianDirection =
        favRating >= medianRating ? "above" : "below";


    container.innerHTML = `
        <p>
            <strong>${escapeHTML(FAV_MOVIE)}</strong>
            has an audience rating of
            <strong>${formatNumber(favRating)}</strong>.
        </p>

        <p>
            It is
            <strong>
                ${formatNumber(differenceFromMin)}
                points higher
            </strong>
            than the lowest-rated movie.
        </p>

        <p>
            It is
            <strong>
                ${formatNumber(differenceFromMax)}
                points lower
            </strong>
            than the highest-rated movie.
        </p>

        <p>
            ${escapeHTML(FAV_MOVIE)}
            is
            <strong>
                ${formatNumber(differenceFromMean)}
                points ${meanDirection}
            </strong>
            the mean movie rating.
        </p>

        <p>
            ${escapeHTML(FAV_MOVIE)}
            is
            <strong>
                ${formatNumber(differenceFromMedian)}
                points ${medianDirection}
            </strong>
            the median movie rating.
        </p>
    `;
}

function renderHistogram(values) {

    Plotly.newPlot(
        "histogram",

        [
            {
                x: values,
                type: "histogram",

                xbins: {
                    start: 0,
                    end: 100,
                    size: 5
                },

                marker: {
                    color: COLORS.green
                },

                hovertemplate:
                    "Rating: %{x}<br>" +
                    "Number of Movies: %{y}" +
                    "<extra></extra>"
            }
        ],

        {
            paper_bgcolor: COLORS.white,
            plot_bgcolor: COLORS.white,

            font: {
                color: COLORS.black
            },

            xaxis: {
                title: "Audience Ratings",
                range: [0, 100],
                gridcolor: COLORS.greenLight
            },

            yaxis: {
                title: "Number of Horror Movies",
                gridcolor: COLORS.greenLight
            },

            margin: {
                t: 30,
                r: 20,
                b: 70,
                l: 70
            }
        },

        {
            responsive: true,
            displaylogo: false
        }
    );
}

function renderScatterplot(rows) {

    const points = rows
        .map(row => ({
            x: toNumber(row.audience_rating),
            y: toNumber(row.critic_rating),
            title: row.movie_title
        }))
        .filter(
            point =>
                point.x !== null &&
                point.y !== null
        );


    Plotly.newPlot(
        "scatterplot",

        [
            {
                x: points.map(point => point.x),
                y: points.map(point => point.y),
                text: points.map(point => point.title),

                mode: "markers",
                type: "scatter",

                // GREEN-MEDIUM DATA POINTS
                marker: {
                    color: COLORS.green,
                    size: 9,
                    opacity: 0.75
                },

                hovertemplate:
                    "<strong>%{text}</strong><br>" +
                    "Audience Rating: %{x}<br>" +
                    "Critic Rating: %{y}" +
                    "<extra></extra>"
            }
        ],

        {
            paper_bgcolor: COLORS.white,
            plot_bgcolor: COLORS.white,

            font: {
                color: COLORS.black
            },

            xaxis: {
                title: "Audience Rating",
                range: [0, 100],
                gridcolor: COLORS.greenLight
            },

            yaxis: {
                title: "Critic Rating",
                range: [0, 100],
                gridcolor: COLORS.greenLight
            },

            hovermode: "closest",

            margin: {
                t: 30,
                r: 20,
                b: 70,
                l: 70
            }
        },

        {
            responsive: true,
            displaylogo: false
        }
    );
}
