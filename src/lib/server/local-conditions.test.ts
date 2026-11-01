import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePuriBulletin } from "../puri-bulletin.ts";

const PAGE = `
<h3>Local Weather Report and Forecast For : <span>Puri</span><br> Dated : Nov 01, 2026</h3>
<table>
  <tr><th>MAX</th><th>MIN</th><th>RAIN</th></tr>
  <tr><td>33.6&deg;C</td><td>2.8</td><td>25.4&deg;C</td><td>2.1</td><td>NIL</td></tr>
</table>
<table>
  <tr><th>Date</th><th>Min Temp</th><th>Max Temp</th><th colspan="2">Weather</th><th colspan="2">Warnings</th></tr>
  <tr>
    <td>01-Nov</td><td>25.0</td><td>32.0</td>
    <td><img src="img/8.gif" alt=""></td>
    <td>Partly cloudy sky with possibility of rain or Thunderstorm</td>
    <td><img src="warning_images/29.png" alt=""></td>
    <td>Thunderstorm accompanied with lightning & gusty winds(30-40kmph)</td>
  </tr>
</table>
`;

describe("parsePuriBulletin", () => {
  it("reads today's sky and warning from the Puri page", () => {
    const bulletin = parsePuriBulletin(PAGE);
    assert.equal(bulletin.ok, true);
    if (!bulletin.ok) return;
    assert.match(bulletin.observed, /33\.6°C/);
    assert.match(bulletin.observed, /25\.4°C/);
    assert.match(bulletin.today, /Partly cloudy/);
    assert.match(bulletin.warning, /30-40kmph/);
  });

  it("fails closed when the table is missing", () => {
    assert.deepEqual(parsePuriBulletin("<html>Puri</html>"), { ok: false });
  });
});
