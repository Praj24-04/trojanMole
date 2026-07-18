from collections import OrderedDict
import torch
import math
def robust_aggregation(num_models, models):
    if not isinstance(num_models, int) or num_models <= 0:
        raise ValueError("num_models must be a positive integer.")
    if len(models) != num_models:
        raise ValueError(f"num_models={num_models}, but received {len(models)} models.")
    
    trim_fraction = 0.2
    trim_count = max(0, math.floor(num_models * trim_fraction))
    parameter_names = list(models[0].keys())
    aggregated = OrderedDict()
    for name in parameter_names:
        reference = models[0][name]
       
        stacked = torch.stack(
            [m[name].detach().to(dtype=torch.float64, device="cpu") for m in models],
            dim=0,
        )
        
        sorted_vals, _ = torch.sort(stacked, dim=0)
        if trim_count > 0 and (num_models - 2 * trim_count) > 0:
            trimmed = sorted_vals[trim_count : num_models - trim_count]
        else:
            trimmed = sorted_vals  # too few models to trim safely, fall back to full set
        aggregated[name] = (
            trimmed.mean(dim=0)
            .to(dtype=reference.dtype)
            .contiguous()
        )
    return aggregated