"""Backend tests for Telugu POS billing API."""
import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@ushakirana.in"
ADMIN_PASSWORD = "usha@123"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Login first to get access token
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.json()["access_token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session", autouse=True)
def seed_db(client):
    r = client.post(f"{API}/seed")
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Auth ----------
class TestAuth:
    def test_unauth_items_returns_401(self):
        r = requests.get(f"{API}/items")
        assert r.status_code == 401, r.text

    def test_login_wrong_password_returns_401_telugu(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrong-pass-xyz"})
        assert r.status_code in (401, 429), r.text
        if r.status_code == 401:
            body = r.json()
            # FastAPI HTTPException default returns {"detail": "..."}
            msg = body.get("detail", "")
            assert "పాస్" in msg or "తప్పు" in msg, f"expected Telugu error, got {msg!r}"

    def test_login_success_and_me(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        me = r.json()
        assert me["email"] == ADMIN_EMAIL
        assert me.get("role") == "admin"

    def test_bearer_token_works_for_items(self, client):
        r = client.get(f"{API}/items")
        assert r.status_code == 200


# ---------- Settings ----------
class TestSettings:
    def test_settings_shape_no_gstin_required(self, client):
        r = client.get(f"{API}/settings")
        assert r.status_code == 200
        data = r.json()
        assert "name" in data and "phone" in data and "address" in data and "footer" in data

    def test_settings_update_persists(self, client):
        current = client.get(f"{API}/settings").json()
        new_payload = {
            "name": "ఉష కిరాణా",
            "phone": "9999900000",
            "address": "మెయిన్ రోడ్, హైదరాబాదు",
            "footer": "ధన్యవాదాలు!",
            "gstin": "",
        }
        r = client.put(f"{API}/settings", json=new_payload)
        assert r.status_code == 200
        got = client.get(f"{API}/settings").json()
        assert got["name"] == new_payload["name"]
        assert got["phone"] == new_payload["phone"]
        assert got["address"] == new_payload["address"]
        # restore
        client.put(f"{API}/settings", json={**current})


# ---------- Items / Seed ----------
class TestSeedAndItems:
    def test_seed_and_items(self, client):
        r = client.get(f"{API}/items")
        assert r.status_code == 200
        items = r.json()
        codes = {i["code"] for i in items}
        for c in ["a1", "a2", "b1", "b2", "c1", "d1", "e1", "e5"]:
            assert c in codes, f"missing {c}"
        assert len(items) >= 25
        a1 = next(i for i in items if i["code"] == "a1")
        assert a1["name_te"] == "వెన్న"

    def test_customers_seeded(self, client):
        r = client.get(f"{API}/customers")
        assert r.status_code == 200
        names = {c["name_te"] for c in r.json()}
        assert "రమేష్ గారు" in names


# ---------- Bulk price ----------
class TestBulkPrice:
    def test_bulk_price_dry_run_then_apply(self, client):
        # baseline b2 price
        items = client.get(f"{API}/items").json()
        b2_before = next(i for i in items if i["code"] == "b2")["price"]
        new_price = b2_before + 5

        # dry run: change b2 price and create new TEST_ item
        rows = [
            {"code": "b2", "price": new_price},
            {"code": "test_bulk1", "price": 99, "name_te": "పరీక్ష వస్తువు"},
        ]
        r = client.post(f"{API}/items/bulk-price", json={"rows": rows, "dry_run": True})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["dry_run"] is True
        upd_codes = [u["code"] for u in data["updated"]]
        cre_codes = [u["code"] for u in data["created"]]
        assert "b2" in upd_codes
        assert "test_bulk1" in cre_codes
        b2_upd = next(u for u in data["updated"] if u["code"] == "b2")
        assert b2_upd["old_price"] == b2_before
        assert b2_upd["price"] == new_price

        # verify DB unchanged
        items2 = client.get(f"{API}/items").json()
        b2_now = next(i for i in items2 if i["code"] == "b2")["price"]
        assert b2_now == b2_before
        assert not any(i["code"] == "test_bulk1" for i in items2)

        # apply
        r = client.post(f"{API}/items/bulk-price", json={"rows": rows, "dry_run": False})
        assert r.status_code == 200
        items3 = client.get(f"{API}/items").json()
        b2_after = next(i for i in items3 if i["code"] == "b2")["price"]
        assert b2_after == new_price
        assert any(i["code"] == "test_bulk1" for i in items3)

        # cleanup: restore b2, delete created
        client.post(f"{API}/items/bulk-price", json={"rows": [{"code": "b2", "price": b2_before}], "dry_run": False})
        created = next(i for i in items3 if i["code"] == "test_bulk1")
        client.delete(f"{API}/items/{created['id']}")


# ---------- Bills ----------
class TestBills:
    def test_cash_bill(self, client):
        items = client.get(f"{API}/items").json()
        a1 = next(i for i in items if i["code"] == "a1")
        b1 = next(i for i in items if i["code"] == "b1")
        lines = [
            {"item_id": a1["id"], "code": "a1", "name_te": a1["name_te"], "unit": a1["unit"],
             "qty": 2, "price": a1["price"], "total": round(2 * a1["price"], 2)},
            {"item_id": b1["id"], "code": "b1", "name_te": b1["name_te"], "unit": b1["unit"],
             "qty": 1, "price": b1["price"], "total": round(1 * b1["price"], 2)},
        ]
        subtotal = round(sum(l["total"] for l in lines), 2)
        discount = 10
        r = client.post(f"{API}/bills", json={"lines": lines, "discount": discount, "payment_mode": "cash"})
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["subtotal"] == subtotal
        assert b["total"] == round(subtotal - discount, 2)
        assert b["payment_mode"] == "cash"
        assert isinstance(b["bill_no"], int) and b["bill_no"] >= 1

    def test_khata_bill_requires_customer(self, client):
        r = client.post(f"{API}/bills", json={
            "lines": [{"code": "a1", "name_te": "వెన్న", "qty": 1, "price": 10, "total": 10}],
            "discount": 0, "payment_mode": "khata"})
        assert r.status_code == 400

    def test_khata_bill_and_settlement(self, client):
        cust = client.get(f"{API}/customers").json()[0]
        cid = cust["id"]
        bal_before = cust["balance"]
        lines = [{"code": "b2", "name_te": "కందిపప్పు", "qty": 1, "price": 100, "total": 100}]
        r = client.post(f"{API}/bills", json={"lines": lines, "discount": 0,
                                              "payment_mode": "khata", "customer_id": cid})
        assert r.status_code == 200, r.text
        bill = r.json()
        assert bill["total"] == 100
        # balance increased
        cust2 = next(c for c in client.get(f"{API}/customers").json() if c["id"] == cid)
        assert round(cust2["balance"] - bal_before, 2) == 100

        # ledger has bill txn
        ledger = client.get(f"{API}/customers/{cid}/ledger").json()
        assert any(t.get("type") == "bill" and t.get("bill_no") == bill["bill_no"] for t in ledger["txns"])

        # settle 40
        r = client.post(f"{API}/customers/{cid}/payment", json={"amount": 40, "mode": "cash"})
        assert r.status_code == 200
        assert round(r.json()["balance"] - bal_before, 2) == 60

        ledger2 = client.get(f"{API}/customers/{cid}/ledger").json()
        assert any(t.get("type") == "payment" and t.get("amount") == 40 for t in ledger2["txns"])


# ---------- Daily report ----------
class TestDailyReport:
    def test_daily_report_shape(self, client):
        r = client.get(f"{API}/report/daily")
        assert r.status_code == 200
        d = r.json()
        for k in ["day", "bill_count", "gross", "modes", "counts",
                  "khata_collected", "cash_in_hand", "top_items", "bills"]:
            assert k in d
        for m in ["cash", "upi", "card", "khata"]:
            assert m in d["modes"]
            assert m in d["counts"]
        for m in ["cash", "upi", "card"]:
            assert m in d["khata_collected"]
