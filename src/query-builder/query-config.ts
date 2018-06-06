import { TermType } from '../proto/enums';

// [TermType, funcName, min arg number, max arg number (-1 = infinite), can have optional args]
// for operations directly under 'r' the max arg number can be increased by 1 since there is no `this`

export type TermConfig = [
  TermType,
  string,
  number,
  number,
  // must exist as the last parameter


    | 'required'
    // can exist as the replacement of last parameter if it's an object
    | 'optional'
    // only last param must be optarg or not exist
    | 'last'
    // only last param must be optarg or not exist, can replace previous args
    | 'last-optional'
    // no optarg
    | false
];

export const bracket: TermConfig = [TermType.BRACKET, '(...)', 1, 1, false];
export const funcall: TermConfig = [TermType.FUNCALL, 'do', 1, -1, false];

export const termConfig: TermConfig[] = [
  [TermType.TABLE, 'table', 1, 2, 'last'],
  [TermType.GET, 'get', 1, 1, false],
  [TermType.GET_ALL, 'getAll', 0, -1, 'optional'],
  [TermType.EQ, 'eq', 1, -1, false],
  [TermType.NE, 'ne', 1, -1, false],
  [TermType.LT, 'lt', 1, -1, false],
  [TermType.LE, 'le', 1, -1, false],
  [TermType.GT, 'gt', 1, -1, false],
  [TermType.GE, 'ge', 1, -1, false],
  [TermType.NOT, 'not', 0, 0, false],
  [TermType.ADD, 'add', 1, -1, false],
  [TermType.SUB, 'sub', 1, -1, false],
  [TermType.MUL, 'mul', 1, -1, false],
  [TermType.DIV, 'div', 1, -1, false],
  [TermType.MOD, 'mod', 1, 1, false],
  [TermType.FLOOR, 'floor', 0, 0, false],
  [TermType.CEIL, 'ceil', 0, 0, false],
  [TermType.ROUND, 'round', 0, -1, false],
  [TermType.APPEND, 'append', 1, 1, false],
  [TermType.PREPEND, 'prepend', 1, 1, false],
  [TermType.DIFFERENCE, 'difference', 1, 1, false],
  [TermType.SET_INSERT, 'setInsert', 1, 1, false],
  [TermType.SET_INTERSECTION, 'setIntersection', 1, 1, false],
  [TermType.SET_UNION, 'setUnion', 1, 1, false],
  [TermType.SET_DIFFERENCE, 'setDifference', 1, 1, false],
  [TermType.SLICE, 'slice', 1, 3, 'last-optional'],
  [TermType.SKIP, 'skip', 1, 1, false],
  [TermType.LIMIT, 'limit', 1, 1, false],
  [TermType.OFFSETS_OF, 'offsetsOf', 1, 1, false],
  [TermType.CONTAINS, 'contains', 1, -1, false],
  [TermType.GET_FIELD, 'getField', 1, 1, false],
  [TermType.KEYS, 'keys', 0, 0, false],
  [TermType.VALUES, 'values', 0, 0, false],
  [TermType.HAS_FIELDS, 'hasFields', 1, -1, false],
  [TermType.WITH_FIELDS, 'withFields', 1, -1, false],
  [TermType.PLUCK, 'pluck', 1, -1, false],
  [TermType.WITHOUT, 'without', 1, -1, false],
  [TermType.MERGE, 'merge', 1, -1, false],
  [TermType.BETWEEN, 'between', 2, 3, 'last'],
  [TermType.REDUCE, 'reduce', 1, 1, false],
  [TermType.MAP, 'map', 1, -1, false],
  [TermType.FOLD, 'fold', 2, 3, 'last'],
  [TermType.FILTER, 'filter', 1, 2, 'last'],
  [TermType.CONCAT_MAP, 'concatMap', 1, 1, false],
  [TermType.ORDER_BY, 'orderBy', 1, -1, 'optional'],
  [TermType.DISTINCT, 'distinct', 0, 1, 'last'],
  [TermType.COUNT, 'count', 0, 1, false],
  [TermType.IS_EMPTY, 'isEmpty', 0, 0, false],
  [TermType.UNION, 'union', 0, -1, 'optional'],
  [TermType.NTH, 'nth', 1, 1, false],
  [TermType.INNER_JOIN, 'innerJoin', 2, 2, false],
  [TermType.OUTER_JOIN, 'outerJoin', 2, 2, false],
  [TermType.EQ_JOIN, 'eqJoin', 2, 3, 'last'],
  [TermType.ZIP, 'zip', 0, 0, false],
  [TermType.INSERT_AT, 'insertAt', 2, 2, false],
  [TermType.DELETE_AT, 'deleteAt', 1, 2, false],
  [TermType.CHANGE_AT, 'changeAt', 2, 2, false],
  [TermType.SPLICE_AT, 'spliceAt', 2, 2, false],
  [TermType.COERCE_TO, 'coerceTo', 1, 1, false],
  [TermType.TYPE_OF, 'typeOf', 0, 0, false],
  [TermType.UPDATE, 'update', 1, 2, 'last'],
  [TermType.DELETE, 'delete', 0, 1, 'last'],
  [TermType.REPLACE, 'replace', 1, 2, 'last'],
  [TermType.INSERT, 'insert', 1, 2, 'last'],
  [TermType.TABLE_CREATE, 'tableCreate', 1, 2, 'last'],
  [TermType.TABLE_DROP, 'tableDrop', 1, 1, false],
  [TermType.TABLE_LIST, 'tableList', 0, 0, false],
  [TermType.CONFIG, 'config', 0, 0, false],
  [TermType.STATUS, 'status', 0, 0, false],
  [TermType.WAIT, 'wait', 0, 1, 'last'],
  [TermType.RECONFIGURE, 'reconfigure', 1, 1, 'required'],
  [TermType.REBALANCE, 'rebalance', 0, 0, false],
  [TermType.SYNC, 'sync', 0, 0, false],
  [TermType.GRANT, 'grant', 2, 2, false],
  [TermType.INDEX_CREATE, 'indexCreate', 1, 3, 'last-optional'],
  [TermType.INDEX_DROP, 'indexDrop', 1, 1, false],
  [TermType.INDEX_LIST, 'indexList', 0, 0, false],
  [TermType.INDEX_STATUS, 'indexStatus', 0, -1, false],
  [TermType.INDEX_WAIT, 'indexWait', 0, -1, false],
  [TermType.INDEX_RENAME, 'indexRename', 2, 3, 'last'],
  [TermType.BRANCH, 'branch', 2, -1, false],
  [TermType.OR, 'or', 0, -1, false],
  [TermType.AND, 'and', 0, -1, false],
  [TermType.FOR_EACH, 'forEach', 1, 1, false],
  [TermType.INFO, 'info', 0, 0, false],
  [TermType.MATCH, 'match', 1, 1, false],
  [TermType.UPCASE, 'upcase', 0, 0, false],
  [TermType.DOWNCASE, 'downcase', 0, 0, false],
  [TermType.SAMPLE, 'sample', 1, 1, false],
  [TermType.DEFAULT, 'default', 1, 1, false],
  [TermType.TO_ISO8601, 'toISO8601', 0, 0, false],
  [TermType.TO_EPOCH_TIME, 'toEpochTime', 0, 0, false],
  [TermType.IN_TIMEZONE, 'inTimezone', 1, 1, false],
  [TermType.DURING, 'during', 2, 3, 'last'],
  [TermType.DATE, 'date', 0, 0, false],
  [TermType.TIME_OF_DAY, 'timeOfDay', 0, 0, false],
  [TermType.TIMEZONE, 'timezone', 0, 0, false],
  [TermType.YEAR, 'year', 0, 0, false],
  [TermType.MONTH, 'month', 0, 0, false],
  [TermType.DAY, 'day', 0, 0, false],
  [TermType.DAY_OF_WEEK, 'dayOfWeek', 0, 0, false],
  [TermType.DAY_OF_YEAR, 'dayOfYear', 0, 0, false],
  [TermType.HOURS, 'hours', 0, 0, false],
  [TermType.MINUTES, 'minutes', 0, 0, false],
  [TermType.SECONDS, 'seconds', 0, 0, false],
  [TermType.GROUP, 'group', 0, -1, 'optional'],
  [TermType.SUM, 'sum', 0, 1, false],
  [TermType.AVG, 'avg', 0, 1, false],
  [TermType.MIN, 'min', 0, 1, 'optional'],
  [TermType.MAX, 'max', 0, 1, 'optional'],
  [TermType.SPLIT, 'split', 0, 2, false],
  [TermType.UNGROUP, 'ungroup', 0, 0, false],
  [TermType.CHANGES, 'changes', 0, 1, 'last'],
  [TermType.TO_GEOJSON, 'toGeojson', 0, 0, false],
  [TermType.DISTANCE, 'distance', 1, 2, 'last'],
  [TermType.INTERSECTS, 'intersects', 1, 1, false],
  [TermType.INCLUDES, 'includes', 1, 1, false],
  [TermType.GET_INTERSECTING, 'getIntersecting', 2, 2, 'required'],
  [TermType.FILL, 'fill', 0, 0, false],
  [TermType.GET_NEAREST, 'getNearest', 2, 2, 'required'],
  [TermType.POLYGON_SUB, 'polygonSub', 1, 1, false],
  [TermType.TO_JSON_STRING, 'toJSON', 0, 0, false],
  [TermType.TO_JSON_STRING, 'toJsonString', 0, 0, false],
  // not documented
  [TermType.SET_WRITE_HOOK, 'setWriteHook', 1, 1, false],
  [TermType.GET_WRITE_HOOK, 'getWriteHook', 0, 0, false],
  [TermType.BIT_AND, 'bitAnd', 1, -1, false],
  [TermType.BIT_OR, 'bitOr', 1, -1, false],
  [TermType.BIT_XOR, 'bitXor', 1, -1, false],
  [TermType.BIT_NOT, 'bitNot', 0, 0, false],
  [TermType.BIT_SAL, 'bitSal', 1, -1, false],
  [TermType.BIT_SAL, 'bitShl', 1, -1, false],
  [TermType.BIT_SAR, 'bitSar', 1, -1, false],
  [197 as any /*TermType.BIT_SHR*/, 'bitShr', 1, -1, false]
];

export const rConfig: TermConfig[] = [
  [TermType.DB, 'db', 1, 1, false],
  [TermType.DB_CREATE, 'dbCreate', 1, 1, false],
  [TermType.DB_DROP, 'dbDrop', 1, 1, false],
  [TermType.GRANT, 'grant', 2, 2, false],
  [TermType.DB_LIST, 'dbList', 0, 0, false],
  [TermType.TABLE, 'table', 1, 2, 'last'],
  [TermType.TABLE_CREATE, 'tableCreate', 1, 2, 'last'],
  [TermType.TABLE_DROP, 'tableDrop', 1, 1, false],
  [TermType.TABLE_LIST, 'tableList', 0, 0, false],
  [TermType.ASC, 'asc', 1, 1, false],
  [TermType.DESC, 'desc', 1, 1, false],
  [TermType.EPOCH_TIME, 'epochTime', 1, 1, false],
  [TermType.NOW, 'now', 0, 0, false],
  [TermType.BINARY, 'binary', 1, 1, false],
  [TermType.ARGS, 'args', 1, 1, false],
  [TermType.TIME, 'time', 4, 7, false],
  [TermType.ISO8601, 'ISO8601', 1, 2, 'last'],
  [TermType.ERROR, 'error', 0, 1, false],
  [TermType.JAVASCRIPT, 'js', 1, 2, 'last'],
  [TermType.JSON, 'json', 1, 1, false],
  [TermType.POINT, 'point', 2, 2, false],
  [TermType.LINE, 'line', 2, -1, false],
  [TermType.POLYGON, 'polygon', 3, -1, false],
  [TermType.CIRCLE, 'circle', 2, 3, 'last'],
  [TermType.LITERAL, 'literal', 0, 1, false],
  [TermType.OBJECT, 'object', 1, -1, false],
  [TermType.RANDOM, 'random', 0, 3, 'last-optional'],
  [TermType.UUID, 'uuid', 0, 1, false],
  [TermType.RANGE, 'range', 1, 2, false],
  [TermType.HTTP, 'http', 1, 2, 'last'],
  [TermType.GEOJSON, 'geojson', 1, 1, false]
];

export const rConsts: Array<[TermType, string]> = [
  [TermType.MINVAL, 'minval'],
  [TermType.MAXVAL, 'maxval'],
  [TermType.MONDAY, 'monday'],
  [TermType.TUESDAY, 'tuesday'],
  [TermType.WEDNESDAY, 'wednesday'],
  [TermType.THURSDAY, 'thursday'],
  [TermType.FRIDAY, 'friday'],
  [TermType.SATURDAY, 'saturday'],
  [TermType.SUNDAY, 'sunday'],
  [TermType.JANUARY, 'january'],
  [TermType.FEBRUARY, 'february'],
  [TermType.MARCH, 'march'],
  [TermType.APRIL, 'april'],
  [TermType.MAY, 'may'],
  [TermType.JUNE, 'june'],
  [TermType.JULY, 'july'],
  [TermType.AUGUST, 'august'],
  [TermType.SEPTEMBER, 'september'],
  [TermType.OCTOBER, 'october'],
  [TermType.NOVEMBER, 'november'],
  [TermType.DECEMBER, 'december']
];
