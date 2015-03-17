var gDefault = "nightly/39";

Telemetry.init(function() {
  var s = d3.select("#versions");
  Telemetry.versions().forEach(function (version) {
    var o = s.append("option").attr("value", version).text(version);
    if (version == gDefault) {
      o.attr("selected", "selected");
    }
  });
  d3.select("#loadButton").property("disabled", false);
});

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function loadVersion() {
  var version = d3.select("#versions").property("value");
  var loadCount = 0;
  var playTime, bufferingCount;
  Telemetry.loadEvolutionOverBuilds(version, "VIDEO_MSE_PLAY_TIME_MS",
    function(data) {
      playTime = data;
      loaded();
    });
  Telemetry.loadEvolutionOverBuilds(version, "VIDEO_MSE_BUFFERING_COUNT",
    function(data) {
      bufferingCount = data;
      loaded();
    });
  function loaded() {
    ++loadCount;
    if (loadCount != 2) {
      return;
    }
    var dateMap = d3.map();
    playTime.each(function(date, histogram) {
      var d = dateStr(date);
      if (!dateMap.has(d)) {
        dateMap.set(d, {});
      }
      dateMap.get(d).playTime = histogram;
    });
    bufferingCount.each(function(date, histogram) {
      var d = dateStr(date);
      if (!dateMap.has(d)) {
        dateMap.set(d, {});
      }
      dateMap.get(d).bufferingCount = histogram;
    });
    var days = dateMap.entries();
    days.sort(function(a, b) { return a.key > b.key; });
    var d = d3.select("#days tbody")
      .selectAll("tr")
      .data(days, function(d) { return d.key; });
    d.exit().remove();
    var n = d.enter().append("tr");
    n.append("td").classed("date", true);
    n.append("td").classed("mtbr", true);

    d.select("td.date").text(function(d) { console.log("d", d); return d.key; });
    d.select("td.mtbr").text(function(d) {
      // histograms don't expose a .sum() function, but we can remultiply the mean
      // var playTime = d.value.playTime.mean() * d.value.playTime.count();
      var playTime = d.value.playTime.sum() / 1000;
      // var bufferings = d.value.bufferingCount.mean() * d.value.bufferingCount.count();
      var bufferings = d.value.bufferingCount.sum();
      return Math.round(playTime / bufferings) + " (" + Math.round(playTime) + "/" + bufferings + ")";
    });
  }
}
