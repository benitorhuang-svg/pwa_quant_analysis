import numpy as np

def MA(prices, period):
    if len(prices) < period:
        return [np.nan] * len(prices)
    arr = np.array(prices)
    weights = np.ones(period) / period
    ma = np.convolve(arr, weights, mode='valid')
    result = np.concatenate((np.full(period - 1, np.nan), ma))
    return result.tolist()

def EMA(prices, period):
    if len(prices) < period:
        return [np.nan] * len(prices)
    ema = np.full(len(prices), np.nan)
    multiplier = 2 / (period + 1)
    
    sma_first = np.mean(prices[:period])
    ema[period - 1] = sma_first
    
    # Python loop is practically required for recursive EMA without scipy
    for i in range(period, len(prices)):
        ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
        
    return ema.tolist()

def MACD(prices, fast_period=12, slow_period=26, signal_period=9):
    fast_ema = np.array(EMA(prices, fast_period))
    slow_ema = np.array(EMA(prices, slow_period))
    
    dif = fast_ema - slow_ema
    
    valid_idx = slow_period - 1
    if valid_idx >= len(dif):
        return [np.nan]*len(prices), [np.nan]*len(prices), [np.nan]*len(prices)
        
    dea = np.full(len(prices), np.nan)
    valid_dif = dif[valid_idx:]
    if len(valid_dif) >= signal_period:
        sma_first = np.mean(valid_dif[:signal_period])
        dea_start_idx = valid_idx + signal_period - 1
        dea[dea_start_idx] = sma_first
        
        multiplier = 2 / (signal_period + 1)
        for i in range(dea_start_idx + 1, len(prices)):
            dea[i] = (dif[i] - dea[i - 1]) * multiplier + dea[i - 1]
            
    macd = (dif - dea) * 2
    return dif.tolist(), dea.tolist(), macd.tolist()

def Cross(fast_arr, slow_arr):
    fast = np.array(fast_arr)
    slow = np.array(slow_arr)
    
    result = np.zeros(len(fast))
    
    # Vectorized Cross
    with np.errstate(invalid='ignore'):
        prev_fast = np.roll(fast, 1)
        prev_slow = np.roll(slow, 1)
        
        golden_cross = (prev_fast <= prev_slow) & (fast > slow)
        death_cross = (prev_fast >= prev_slow) & (fast < slow)
        
        result[golden_cross] = 1
        result[death_cross] = -1
        result[0] = 0 # first element is invalid
            
    return result.tolist()

def BOLL(prices, period=20, multiplier=2):
    if len(prices) < period:
        nan_arr = [np.nan] * len(prices)
        return nan_arr, nan_arr, nan_arr
        
    arr = np.array(prices)
    mid = MA(prices, period)
    
    up = np.full(len(prices), np.nan)
    down = np.full(len(prices), np.nan)
    
    # Vectorized standard deviation using sliding window
    from numpy.lib.stride_tricks import sliding_window_view
    if len(arr) >= period:
        windows = sliding_window_view(arr, period)
        stds = np.std(windows, axis=1, ddof=0)
        up[period-1:] = np.array(mid)[period-1:] + stds * multiplier
        down[period-1:] = np.array(mid)[period-1:] - stds * multiplier
        
    return up.tolist(), mid, down.tolist()

def ATR(highs, lows, closes, period=14):
    highs = np.array(highs)
    lows = np.array(lows)
    closes = np.array(closes)
    
    prev_closes = np.roll(closes, 1)
    prev_closes[0] = closes[0]
    
    tr1 = highs - lows
    tr2 = np.abs(highs - prev_closes)
    tr3 = np.abs(lows - prev_closes)
    
    trs = np.maximum(tr1, np.maximum(tr2, tr3))
    trs[0] = highs[0] - lows[0]
    
    atr = np.full(len(highs), np.nan)
    if len(highs) >= period:
        atr[period-1] = np.mean(trs[:period])
        for i in range(period, len(highs)):
            atr[i] = (atr[i-1] * (period - 1) + trs[i]) / period
            
    return atr.tolist()

def RSI(prices, period=14):
    if len(prices) < period: return [np.nan]*len(prices)
    arr = np.array(prices)
    deltas = np.diff(arr)
    
    rsi = np.zeros(len(prices))
    
    up_val = np.maximum(deltas, 0)
    down_val = -np.minimum(deltas, 0)
    
    avg_up = np.zeros(len(deltas))
    avg_down = np.zeros(len(deltas))
    
    avg_up[period-1] = np.mean(up_val[:period])
    avg_down[period-1] = np.mean(down_val[:period])
    
    for i in range(period, len(deltas)):
        avg_up[i] = (avg_up[i-1] * (period - 1) + up_val[i]) / period
        avg_down[i] = (avg_down[i-1] * (period - 1) + down_val[i]) / period
        
    with np.errstate(divide='ignore', invalid='ignore'):
        rs = avg_up / avg_down
        rsi_vals = 100.0 - (100.0 / (1.0 + rs))
        
    # Handle divide by zero correctly
    rsi_vals = np.where(avg_down == 0, 100.0, rsi_vals)
    rsi[1:] = rsi_vals
    rsi[:period] = np.nan
    
    return rsi.tolist()

def ADX(highs, lows, closes, period=14):
    n = len(closes)
    if n < period * 2:
        return [np.nan]*n, [np.nan]*n, [np.nan]*n
        
    highs = np.array(highs)
    lows = np.array(lows)
    closes = np.array(closes)

    up_move = np.zeros(n)
    down_move = np.zeros(n)
    
    up_move[1:] = highs[1:] - highs[:-1]
    down_move[1:] = lows[:-1] - lows[1:]
    
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
    
    prev_closes = np.roll(closes, 1)
    prev_closes[0] = closes[0]
    
    tr1 = highs - lows
    tr2 = np.abs(highs - prev_closes)
    tr3 = np.abs(lows - prev_closes)
    tr = np.maximum(tr1, np.maximum(tr2, tr3))
    tr[0] = highs[0] - lows[0]
    
    tr_smooth = np.zeros(n)
    pdm_smooth = np.zeros(n)
    mdm_smooth = np.zeros(n)
    
    tr_smooth[period] = np.sum(tr[1:period+1])
    pdm_smooth[period] = np.sum(plus_dm[1:period+1])
    mdm_smooth[period] = np.sum(minus_dm[1:period+1])
    
    for i in range(period+1, n):
        tr_smooth[i] = tr_smooth[i-1] - (tr_smooth[i-1]/period) + tr[i]
        pdm_smooth[i] = pdm_smooth[i-1] - (pdm_smooth[i-1]/period) + plus_dm[i]
        mdm_smooth[i] = mdm_smooth[i-1] - (mdm_smooth[i-1]/period) + minus_dm[i]
        
    with np.errstate(divide='ignore', invalid='ignore'):
        plus_di = 100 * pdm_smooth / tr_smooth
        minus_di = 100 * mdm_smooth / tr_smooth
        dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di)
        dx = np.nan_to_num(dx, nan=0.0)
    
    adx = np.full(n, np.nan)
    adx[period*2 - 1] = np.mean(dx[period:period*2])
    for i in range(period*2, n):
        adx[i] = (adx[i-1] * (period - 1) + dx[i]) / period
        
    return adx.tolist(), plus_di.tolist(), minus_di.tolist()

def Highest(prices, period):
    if len(prices) == 0: return []
    result = np.full(len(prices), np.nan)
    arr = np.array(prices)
    from numpy.lib.stride_tricks import sliding_window_view
    if len(arr) >= period:
        windows = sliding_window_view(arr, period)
        result[period-1:] = np.max(windows, axis=1)
    return result.tolist()

def Lowest(prices, period):
    if len(prices) == 0: return []
    result = np.full(len(prices), np.nan)
    arr = np.array(prices)
    from numpy.lib.stride_tricks import sliding_window_view
    if len(arr) >= period:
        windows = sliding_window_view(arr, period)
        result[period-1:] = np.min(windows, axis=1)
    return result.tolist()

def AMA(prices, n=10, fast=2, slow=30):
    n_len = len(prices)
    if n_len < n: return [np.nan]*n_len
    
    ama = np.full(n_len, np.nan)
    arr = np.array(prices)
    
    diff = np.zeros(n_len)
    diff[1:] = np.abs(np.diff(arr))
    
    from numpy.lib.stride_tricks import sliding_window_view
    if n_len > n:
        # Vectorized ER calculation
        abs_diff = np.abs(arr[n:] - arr[:-n])
        vol_windows = sliding_window_view(diff[1:], n)
        total_abs_diff = np.sum(vol_windows, axis=1)
        
        # Safety for division
        total_abs_diff = np.where(total_abs_diff == 0, 1e-8, total_abs_diff)
        er_arr = abs_diff / total_abs_diff
        
        er = np.zeros(n_len)
        er[n:] = er_arr
        
        fsc = 2 / (fast + 1)
        ssc = 2 / (slow + 1)
        sc = (er * (fsc - ssc) + ssc) ** 2
        
        ama[n-1] = arr[n-1]
        for i in range(n, n_len):
            ama[i] = ama[i-1] + sc[i] * (arr[i] - ama[i-1])
            
    return ama.tolist()

def AROON(highs, lows, period=25):
    n = len(highs)
    if n <= period: return [np.nan]*n, [np.nan]*n
    
    highs = np.array(highs)
    lows = np.array(lows)
    
    aroon_up = np.full(n, np.nan)
    aroon_down = np.full(n, np.nan)
    
    from numpy.lib.stride_tricks import sliding_window_view
    hw = sliding_window_view(highs, period + 1)
    lw = sliding_window_view(lows, period + 1)
    
    # We need the most recent index if there are duplicates
    # Reversing the window and finding argmax gives us period - argmax
    days_since_high = np.argmax(hw[:, ::-1], axis=1)
    days_since_low = np.argmin(lw[:, ::-1], axis=1)
    
    aroon_up[period:] = ((period - days_since_high) / period) * 100
    aroon_down[period:] = ((period - days_since_low) / period) * 100
        
    return aroon_up.tolist(), aroon_down.tolist()

def EMV(highs, lows, volumes, period=14):
    n = len(highs)
    if n < 2: return [0.0]*n
    
    highs = np.array(highs)
    lows = np.array(lows)
    vols = np.array(volumes)
    
    emv_raw = np.zeros(n)
    mid_move = np.zeros(n)
    
    mid = (highs + lows) / 2
    mid_move[1:] = mid[1:] - mid[:-1]
    
    hl_diff = highs - lows
    # Add tiny epsilon to avoid division by zero
    hl_diff = np.where(hl_diff == 0, 1e-8, hl_diff)
    
    box_ratio = (vols / 1000000) / hl_diff
    box_ratio = np.where(box_ratio == 0, 1e-8, box_ratio)
    
    emv_raw[1:] = mid_move[1:] / box_ratio[1:]
    
    emv_ma = MA(emv_raw.tolist(), period)
    return emv_ma

def CMI(closes, period=14):
    n = len(closes)
    if n < period: return [50.0]*n
    
    cmi = np.full(n, np.nan)
    arr = np.array(closes)
    
    from numpy.lib.stride_tricks import sliding_window_view
    if n > period:
        abs_change = np.abs(arr[period:] - arr[:-period])
        windows = sliding_window_view(arr, period + 1)
        highs = np.max(windows, axis=1)
        lows = np.min(windows, axis=1)
        diff = highs - lows
        
        diff = np.where(diff == 0, 1e-8, diff)
        cmi[period:] = (abs_change / diff) * 100
            
    return cmi.tolist()
