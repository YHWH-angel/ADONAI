#ifndef ADONAI_POLICY_HYBRIDFEE_H
#define ADONAI_POLICY_HYBRIDFEE_H

#include <consensus/amount.h>
#include <policy/feerate.h>
#include <policy/policy.h>

/**
 * Compute the required fee for a transaction given its weight and total output
 * value. A consolidation discount may be applied when the consolidation flag is
 * set. The current implementation simply applies the minimum relay feerate.
 */
static inline CAmount CalculateFee(int64_t weight, CAmount /*value_out*/, bool /*consolidation*/ = false)
{
    const CFeeRate feerate{DEFAULT_MIN_RELAY_TX_FEE};
    return feerate.GetFee(weight);
}

#endif // ADONAI_POLICY_HYBRIDFEE_H
