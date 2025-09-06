# Hybrid Fee Model

Adonai uses a hybrid formula to compute transaction fees:

```
fee = α · weight + β · value
```

- **α** – base cost per kiloweight (default `0.000001 ADO/kvB`).
- **β** – proportional cost to the total output value (default `0.0005%`).
- **Minimum** – transactions always pay at least `0.000001 ADO`.
- **Maximum** – fees are capped at `0.01 ADO` regardless of value.

A discount is applied when consolidating many old UTXOs to encourage
cleanup of the UTXO set.

## Runtime configuration

The model parameters can be queried and adjusted using RPC:

```
$ adonai-cli getfeemodel
{
  "alpha": 0.000001,
  "beta": 0.000005,
  "minfee": 0.000001,
  "maxfee": 0.01
}

$ adonai-cli setfeemodel 0.000002 0.000007 0.000001 0.01
```

Command line options `-feemodelalpha`, `-feemodelbeta`,
`-feemodelmin` and `-feemodelmax` allow setting the values at startup.

## Examples

- Sending 1 ADO → fee ≈ `0.000006 ADO`.
- Sending 10 000 ADO → fee hits the cap at `0.01 ADO`.
- Consolidating many small inputs → fee is halved by the consolidation
  discount.
