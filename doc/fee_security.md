# Fees and Network Security

Adonai blocks are mined roughly every 45 seconds and include a block subsidy
reward alongside transaction fees. The hybrid fee model produces relatively
small fees, so the subsidy remains the primary security incentive for miners.

To monitor the contribution of fees to miner revenue, use `getblockstats` and
inspect the `feeratio` field, which reports the ratio of total fees to the block
subsidy.

Example:

```
$ adonai-cli getblockstats 1000 '["feeratio","totalfee","subsidy"]'
{
  "feeratio": 0.02,
  "totalfee": 0.00200000,
  "subsidy": 0.1
}
```

In this example, fees accounted for 2% of the block subsidy. Monitoring this
ratio helps evaluate when fees become a significant component of miner rewards.
