import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const userDataSource = await readFile(new URL("../assets/termo-user-data.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const migrationSource = await readFile(
  new URL("../supabase/migrations/20260912014401_create_simulator_activity.sql", import.meta.url),
  "utf8"
);

function bootUserData(options = {}) {
  const rpcCalls = [];
  const queryCalls = [];
  const activityRows = options.activityRows || [];
  const rpcRow = options.rpcRow || {
    simulator_id: "S01",
    simulator_slug: "termometros",
    simulator_title: "Escalas termométricas",
    simulator_path: "simulators/termometros.html",
    first_opened_at: "2026-09-11T12:00:00.000Z",
    last_opened_at: "2026-09-11T12:00:00.000Z",
    open_count: 1
  };

  const query = {
    select(columns) { queryCalls.push(["select", columns]); return this; },
    eq(column, value) { queryCalls.push(["eq", column, value]); return this; },
    order(column, config) { queryCalls.push(["order", column, config]); return this; },
    limit(value) {
      queryCalls.push(["limit", value]);
      return Promise.resolve({ data: activityRows, error: null });
    }
  };

  const supabase = {
    rpc(name, payload) {
      rpcCalls.push({ name, payload });
      return {
        single() {
          return Promise.resolve({ data: rpcRow, error: null });
        }
      };
    },
    from(table) {
      queryCalls.push(["from", table]);
      return query;
    }
  };

  const window = {
    location: {
      origin: "https://termo.app.br",
      pathname: "/index.html",
      search: "?view=simulators",
      hash: ""
    },
    TermoAuth: {
      ensureSupabase() { return Promise.resolve(supabase); },
      getSession() { return Promise.resolve(options.session || null); }
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {}
  };
  const document = { title: "TERMO" };
  const context = vm.createContext({
    window,
    document,
    URL,
    Date,
    Math,
    CustomEvent: class CustomEvent {
      constructor(type, config) { this.type = type; this.detail = config?.detail; }
    }
  });

  vm.runInContext(userDataSource, context);
  return { window, rpcCalls, queryCalls };
}

const simulator = {
  id: "S01",
  slug: "termometros",
  title: "Escalas termométricas",
  standaloneUrl: "simulators/termometros.html"
};

test("visitante anônimo não registra atividade identificável", async function () {
  const runtime = bootUserData();
  const result = await runtime.window.TermoUserData.recordSimulatorOpen(simulator);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_authenticated");
  assert.equal(runtime.rpcCalls.length, 0);
});

test("entrada inválida falha antes de acessar o Supabase", async function () {
  const runtime = bootUserData({ session: { user: { id: "user-1" } } });
  const result = await runtime.window.TermoUserData.recordSimulatorOpen({
    id: "S01",
    slug: "termometros",
    title: "Escalas termométricas",
    standaloneUrl: "../private.html"
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid_simulator");
  assert.equal(runtime.rpcCalls.length, 0);
});

test("usuário autenticado registra somente o simulador canônico", async function () {
  const runtime = bootUserData({ session: { user: { id: "user-1" } } });
  const result = await runtime.window.TermoUserData.recordSimulatorOpen(simulator);
  assert.equal(result.ok, true);
  assert.equal(result.activity.simulatorId, "S01");
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.rpcCalls)), [{
    name: "record_simulator_open",
    payload: {
      p_simulator_id: "S01",
      p_simulator_slug: "termometros",
      p_simulator_title: "Escalas termométricas",
      p_simulator_path: "simulators/termometros.html"
    }
  }]);
});

test("listagem filtra o próprio usuário e ordena por última abertura", async function () {
  const runtime = bootUserData({
    session: { user: { id: "user-1" } },
    activityRows: [{
      simulator_id: "S02",
      simulator_slug: "eqtermico",
      simulator_title: "Equilíbrio térmico",
      simulator_path: "simulators/eqtermico.html",
      first_opened_at: "2026-09-10T12:00:00.000Z",
      last_opened_at: "2026-09-11T12:00:00.000Z",
      open_count: 3
    }]
  });
  const result = await runtime.window.TermoUserData.listSimulatorActivity({ limit: 9 });
  assert.equal(result.ok, true);
  assert.equal(result.activities[0].openCount, 3);
  assert.ok(runtime.queryCalls.some((call) => call[0] === "from" && call[1] === "simulator_activity"));
  assert.ok(runtime.queryCalls.some((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === "user-1"));
  assert.ok(runtime.queryCalls.some((call) => call[0] === "order" && call[1] === "last_opened_at" && call[2].ascending === false));
});

test("migration aplica privilégios mínimos, RLS e incremento atômico", function () {
  assert.match(migrationSource, /alter table public\.simulator_activity enable row level security/i);
  assert.match(migrationSource, /revoke all on table public\.simulator_activity from public, anon, authenticated/i);
  assert.match(migrationSource, /grant select on table public\.simulator_activity to authenticated/i);
  assert.match(migrationSource, /using \([\s\S]*auth\.uid\(\)[\s\S]*= user_id[\s\S]*\)/i);
  assert.match(migrationSource, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migrationSource, /open_count = public\.simulator_activity\.open_count \+ 1/i);
  assert.match(migrationSource, /revoke all on function public\.record_simulator_open[\s\S]*from public, anon/i);
});

test("interface preserva nova aba, mostra histórico privado e não concede pontos", function () {
  assert.match(indexSource, /data-role="record-simulator-open"/);
  assert.match(indexSource, /target="_blank"/);
  assert.match(indexSource, /Histórico privado das suas aberturas/);
  assert.match(indexSource, /Abrir simuladores não gera pontos automaticamente/);

  const start = userDataSource.indexOf("async function recordSimulatorOpen");
  const end = userDataSource.indexOf("async function listSimulatorActivity");
  const recorderSource = userDataSource.slice(start, end);
  assert.doesNotMatch(recorderSource, /gamification|xp|points|pontos/i);
});
