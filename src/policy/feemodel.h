#ifndef ADONAI_POLICY_FEEMODEL_H
#define ADONAI_POLICY_FEEMODEL_H

#include <consensus/amount.h>
#include <policy/feerate.h>
#include <util/result.h>
#include <cmath>
#include <algorithm>

class ArgsManager;

struct FeeModel {
    CFeeRate alpha;  // base fee per kB
    double beta;     // proportional fee to value
    CAmount min_fee; // minimum absolute fee
    CAmount max_fee; // maximum absolute fee
};

inline constexpr CAmount DEFAULT_FEE_MODEL_ALPHA{100};     // 0.000001 ADO/kvB
inline constexpr double DEFAULT_FEE_MODEL_BETA{0.000005};  // 0.0005%
inline constexpr CAmount DEFAULT_FEE_MODEL_MIN{100};       // 0.000001 ADO
inline constexpr CAmount DEFAULT_FEE_MODEL_MAX{1'000'000}; // 0.01 ADO

extern FeeModel g_fee_model;

util::Result<void> ApplyArgsManFeeModel(const ArgsManager& args, FeeModel& model);

CAmount CalculateFee(const FeeModel& model, int64_t weight, CAmount value, bool consolidation = false);

#endif // ADONAI_POLICY_FEEMODEL_H
