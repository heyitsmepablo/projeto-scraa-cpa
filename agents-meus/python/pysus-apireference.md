API Reference
The pysus.api package provides a layered architecture for discovering, downloading, and reading data from Brazilian public health databases (DATASUS). It supports three remote data sources.

Architecture Overview
The package is organized into a hierarchy of abstract base classes and concrete implementations:

pysus/api/
├── **init**.py # Package entry (re-exports PySUS)
├── client.py # Main PySUS orchestrator
├── extensions.py # File format handlers
├── models.py # Abstract base classes
├── types.py # Type aliases
├── \_impl/
│ └── databases.py # High-level convenience functions
├── ducklake/ # S3 DuckLake catalog client
├── ftp/ # FTP client
└── dadosgov/ # dados.gov.br API client
Quick Start
The simplest way to use PySUS is via the high-level convenience functions:

from pysus import sinan

df = sinan(disease="dengue", year=2023)
Or with the async API:

from pysus.api.client import PySUS

async with PySUS() as pysus:
files = await pysus.query(dataset="sinan", group="DENG", year=2023)
for f in files:
await pysus.download(f)
Main Client
Main orchestrator for the PySUS data pipeline.

Manages file downloads, local state tracking, catalog attachment, Parquet conversion, and query execution across multiple backends.

classpysus.api.client.Base(\*\*kwargs: Any)[source]
Bases: DeclarativeBase

Base declarative class for SQLAlchemy ORM models.

metadata: ClassVar[MetaData]= MetaData()
Refers to the \_schema.MetaData collection that will be used for new \_schema.Table objects.

See also

Accessing Table and Metadata

registry: ClassVar[_RegistryType]= <sqlalchemy.orm.decl_api.registry object>
Refers to the \_orm.registry in use where new \_orm.Mapper objects will be associated.

classpysus.api.client.DownloadStatus(value)[source]
Bases: Enum

Download status values tracked for each local file.

COMPLETED= 'completed'
DOWNLOADING= 'downloading'
FAILED= 'failed'
MISSING= 'missing'
PENDING= 'pending'
classpysus.api.client.LocalFileState(\*\*kwargs)[source]
Bases: Base

ORM model tracking the state of a downloaded local file.

client_name: Mapped[str]
group: Mapped[str | None]
last_synced: Mapped[datetime]
month: Mapped[int | None]
path: Mapped[str]
remote_path: Mapped[str]
sha256: Mapped[str | None]
state: Mapped[str | None]
status: Mapped[DownloadStatus]
year: Mapped[int | None]
classpysus.api.client.PySUS(db_path: Path = PosixPath('/home/docs/pysus/config.db'))[source]
Bases: object

Central orchestrator for downloading and querying PySUS datasets.

asyncdownload(file: BaseRemoteFile, token: str | None = None, callback: Callable | None = None, timeout: float | None = None)→ BaseLocalFile[source]
Download a remote file and return a local file handle.

Skips re-download if a matching local copy already exists.

Parameters
:
file (BaseRemoteFile) – The remote file to download.

token (str, optional) – Access token for authenticated clients (e.g. DadosGov).

callback (Callable, optional) – Progress callback invoked during the download.

timeout (float, optional) – Maximum seconds to wait for the download. None (default) means no timeout.

Returns
:
The downloaded file wrapped in the appropriate handler.

Return type
:
BaseLocalFile

Raises
:
ValueError – If the file’s client is not recognised.

RuntimeError – If the download fails for any reason.

asyncdownload_to_parquet(file: BaseRemoteFile, token: str | None = None, callback: Callable[[int, int], None] | None = None, timeout: float | None = None, add_dv: bool = True)→ Parquet[source]
Download a file and convert it to Parquet format.

Parameters
:
file (BaseRemoteFile) – The remote file to download and convert.

token (str, optional) – Access token for authenticated clients.

callback (Callable[[int, int], None], optional) – Progress callback.

timeout (float, optional) – Maximum seconds to wait for the download.

add_dv (bool, optional) – Whether to apply the IBGE verification digit on load (default True).

Returns
:
The converted Parquet file handler.

Return type
:
Parquet

Raises
:
NotImplementedError – If the downloaded file type cannot be converted to Parquet.

get_completed_remote_paths()→ set[str][source]
Return remote paths for all successfully downloaded files.

asyncget_dadosgov(access_token: str | None)→ DadosGov[source]
Return the DadosGov client, connecting lazily if needed.

asyncget_ducklake(callback: Callable[[int, int], None] | None = None)→ DuckLake[source]
Return the DuckLake client, initializing it lazily if needed.

asyncget_ftp()→ FTP[source]
Return the FTP client, connecting lazily if needed.

asyncget_local_file(file: BaseRemoteFile)→ BaseLocalFile | None[source]
Look up a previously downloaded file by its remote path.

get_local_hierarchy()[source]
Build a nested dict of cached files grouped by client and dataset.

Returns
:
Nested dict keyed by {client: {dataset: {group: [files]}}}.

Return type
:
dict

asyncquery(client: Annotated[str, AfterValidator(func=_validate_origin)] | None = None, dataset: str | list[str] | None = None, group: str | list[str] | None = None, state: str | list[str] | None = None, year: int | list[int] | None = None, month: int | list[int] | None = None)→ list[BaseRemoteFile][source]
Query available datasets through the DuckLake catalog.

Parameters
:
client (Origin, optional) – Source client to filter by.

dataset (str or list of str, optional) – Dataset name(s) to filter by.

group (str or list of str, optional) – Group name pattern(s) to filter by (case-insensitive ILIKE).

state (str or list of str, optional) – Two-letter state code(s) to filter by.

year (int or list of int, optional) – Year(s) to filter by.

month (int or list of int, optional) – Month(s) to filter by.

Returns
:
List of matching File objects.

Return type
:
list

read_parquet(paths: list[Path], sql: str | None = None, mode: Literal['union', 'intersection', 'strict'] = 'union', add_dv: bool = True)→ DuckDBPyConnection | pd.DataFrame[source]
Read Parquet files with optional schema handling and SQL filter.

Parameters
:
paths (list of Path) – One or more Parquet file paths to read.

sql (str, optional) – Optional SQL filter expression applied to the result.

mode ({"union", "intersection", "strict"}, optional) – Schema resolution mode (default "union").

add_dv (bool, optional) – When True, automatically applies the IBGE verification digit to municipality code columns. If matching columns are found, a DataFrame is returned instead of a DuckDBPyConnection.

Returns
:
The query result.

Return type
:
DuckDBPyConnection or pd.DataFrame

Raises
:
ValueError – If no paths are provided, or if the schema mode is "strict" and the files have differing schemas.

Types
Utilities
pysus.api.utils.add_dv(geocode: str)→ str[source]
Add the IBGE verification digit to a municipality code.

Parameters
:
geocode (str) – The municipality code (6 or 7 digits).

Returns
:
The code with the verification digit appended, or the original string if it cannot be processed.

Return type
:
str

pysus.api.utils.is_geocode_column(name: str)→ bool[source]
Check if a column name corresponds to an IBGE municipality code.

File Format Handlers
Map file extensions and MIME types to their handler classes.

classpysus.api.extensions.CSV(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'CSV')[source]
Bases: BaseTabularFile

Represents a CSV file with automatic encoding and separator detection.

propertycolumns: list[Column]
Return the column metadata from the CSV header row.

asyncload()→ DataFrame[source]
Read the entire CSV into a DataFrame.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyrows: int
Return the number of data rows in the file.

asyncstream(chunk_size: int = 10000)→ AsyncGenerator[DataFrame, None][source]
Yield the CSV in chunks of the given number of rows.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.DBC(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'DBC')[source]
Bases: BaseTabularFile

Represents a compressed DBC file, convertible to DBF then Parquet.

propertycolumns: list[Column]
Not supported for DBC files. Convert to Parquet first.

asyncload()→ DataFrame[source]
Convert to Parquet and load the result as a DataFrame.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

propertyrows: int
Not supported for DBC files. Convert to Parquet first.

asyncstream(chunk_size: int = 10000)→ AsyncGenerator[DataFrame, None][source]
Convert to Parquet and stream its chunks.

asyncto_parquet(output_path: str | Path | None = None, chunk_size: int = 30000, callback: Callable[[int, int], None] | None = None)→ Parquet[source]
Convert the file to Parquet format.

Parameters
:
output_path (str or Path, optional) – Destination path for the Parquet file. Defaults to the source path with a .parquet extension.

chunk_size (int, optional) – Number of rows per streaming chunk (default 10 000).

callback (Callable[[int, int], None], optional) – Function called after each chunk with (current_rows, total_rows).

Returns
:
The resulting Parquet wrapper object.

Return type
:
Parquet

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.DBF(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'DBF')[source]
Bases: BaseTabularFile

Represents a dBASE (DBF) file.

propertycolumns: list[Column]
Return the column metadata from the DBF file.

decode_column(value)[source]
Decode a raw DBF value, handling byte strings and null bytes.

Parameters
:
value (bytes or str or Any) – The value to decode.

Returns
:
The decoded and stripped string, or the original value if it is neither bytes nor str.

Return type
:
str or Any

asyncload(fast: bool = True)→ DataFrame[source]
Read the entire DBF file into a DataFrame.

Parameters
:
fast (bool) – If True use the byte-level reader (default), falling back to dbfread on failure. If False use dbfread.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyrows: int
Return the number of records in the DBF file.

asyncstream(chunk_size: int = 30000, fast: bool = True)→ AsyncGenerator[DataFrame, None][source]
Yield the DBF records in chunks of the given size.

Parameters
:
chunk_size (int) – Number of rows per chunk.

fast (bool) – If True use the byte-level reader (default), falling back to dbfread on failure. If False use dbfread.

asyncto_parquet(output_path: str | Path | None = None, chunk_size: int = 30000, callback: Callable[[int, int], None] | None = None, fast: bool = True)→ Parquet[source]
Convert the DBF file to Parquet format.

Parameters
:
output_path (str or Path, optional)

chunk_size (int) – Rows per chunk when building Parquet.

callback (callable, optional)

fast (bool) – If True use the byte-level reader (default). If False use dbfread.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.Directory(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'DIR')[source]
Bases: BaseLocalFile

Represents a directory on the local filesystem.

asyncload()→ list[BaseLocalFile][source]
Load all entries inside the directory as file objects.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncstream(chunksize: int = 10000)→ AsyncGenerator[BaseLocalFile, None][source]
Yield each entry inside the directory as a file object.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.ExtensionFactory[source]
Bases: object

Factory that maps file content and extensions to handler classes.

async classmethodget_file_class(path: Path)→ type[BaseLocalFile][source]
Return the handler class for a given path.

First attempts content-based identification; falls back to extension matching.

Parameters
:
path (Path) – The file path to classify.

Returns
:
The handler class for the file type.

Return type
:
type[BaseLocalFile]

async classmethodinstantiate(path: str | Path)→ BaseLocalFile[source]
Create and return the appropriate file handler for a path.

Determines whether the path is a directory or a file, resolves the handler class, and instantiates it.

Parameters
:
path (str or Path) – The filesystem path to wrap in a handler.

Returns
:
The instantiated file handler.

Return type
:
BaseLocalFile

classpysus.api.extensions.File(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'FILE')[source]
Bases: BaseLocalFile

Represents a generic local file with no special handling.

asyncload()→ bytes[source]
Read the entire file contents into memory as bytes.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncstream(chunk_size: int = 1048576)→ AsyncGenerator[bytes, None][source]
Yield the file contents in chunks of the given size.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.GZip(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'GZIP')[source]
Bases: BaseCompressedFile

Represents a GZip-compressed file.

asyncextract(target_dir: Path = PosixPath('/home/docs/pysus'))→ list[BaseLocalFile][source]
Decompress the file to a target directory and return it as a file object.

asynclist_members()→ list[str][source]
Return a list containing the single decompressed file name.

asyncload()→ bytes[source]
Decompress and read the entire file contents into memory.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncopen_member(member_name: str)→ bytes[source]
Read and return the decompressed file contents.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.JSON(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'JSON')[source]
Bases: BaseTabularFile

Represents a JSON file with tabular data.

propertycolumns: list[Column]
Return the column metadata from the JSON file.

asyncload()→ DataFrame[source]
Read the entire JSON file into a DataFrame.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

propertyrows: int
Return the number of rows in the JSON file.

asyncstream(chunk_size: int = 10000)→ AsyncGenerator[DataFrame, None][source]
Yield the entire JSON file as a single DataFrame.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.PDF(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'PDF')[source]
Bases: BaseLocalFile

Represents a PDF file.

asyncload()→ bytes[source]
Read the entire PDF file contents into memory as bytes.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncstream(chunk_size: int | None = None)→ AsyncGenerator[bytes, None][source]
Yield the PDF file contents in chunks of the given size.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.Parquet(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'PARQUET', add_dv: bool = True)[source]
Bases: BaseTabularFile

Represents a Parquet file with optional date and integer type parsing.

add_dv: bool
propertycolumns: list[Column]
Return the column metadata from the Parquet schema.

asyncload(parse: bool = True)→ DataFrame[source]
Read the entire Parquet file into a DataFrame.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

staticparse_dftypes(df: DataFrame)→ DataFrame[source]
Convert known date and integer columns to their proper types.

propertyrows: int
Return the number of rows from the Parquet metadata.

propertyschema: Schema
Return the Parquet schema as a PyArrow Schema object.

asyncstream(chunk_size: int = 10000, parse: bool = False)→ AsyncGenerator[DataFrame, None][source]
Yield the Parquet file in batches of the given size.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.Tar(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'TAR')[source]
Bases: BaseCompressedFile

Represents a Tar archive file.

asyncextract(target_dir: Path = PosixPath('/home/docs/pysus'))→ list[BaseLocalFile][source]
Extract members to a target directory and return as file objects.

asynclist_members()→ list[str][source]
Return the list of member names inside the archive.

asyncload()→ TarFile[source]
Open and return the tar archive.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncopen_member(member_name: str)→ bytes[source]
Read and return the contents of a named archive member.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
classpysus.api.extensions.Zip(\*, path: Path, type: Annotated[str, AfterValidator(func=_validate_file_type)] = 'ZIP')[source]
Bases: BaseCompressedFile

Represents a ZIP archive file.

asyncextract(target_dir: Path = PosixPath('/home/docs/pysus'))→ list[BaseLocalFile][source]
Extract members to a target directory and return as file objects.

asynclist_members()→ list[str][source]
Return the list of member names inside the archive.

asyncload()→ ZipFile[source]
Open and return the ZIP archive.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

asyncopen_member(member_name: str)→ bytes[source]
Read and return the contents of a named archive member.

asyncto_parquet(output_path: str | Path | None = None, chunk_size: int = 30000, callback: Callable[[int, int], None] | None = None)→ Parquet[source]
Extract the archive and convert the first tabular file to Parquet.

type: Annotated[str, AfterValidator(func=_validate_file_type)]
Abstract Base Models
Abstract model hierarchy for PySUS data access.

Provides abstract base classes for local and remote file handling, organized in a layered hierarchy: BaseFile -> BaseLocalFile -> BaseTabularFile / BaseCompressedFile for local files, and BaseFile -> BaseRemoteFile for remote files, alongside BaseRemoteObject -> BaseRemoteGroup / BaseRemoteDataset / BaseRemoteClient for remote data catalogs.

classpysus.api.models.BaseCompressedFile(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)])[source]
Bases: BaseLocalFile, ABC

Abstract base for a compressed archive file (e.g. .zip, .gz).

Subclasses must implement list_members, open_member, and extract.

abstractmethod asyncextract(target_dir: Path = PosixPath('/home/docs/pysus'))→ list[BaseLocalFile][source]
Extract all members into target_dir and return the file objects.

abstractmethod asynclist_members()→ list[str][source]
Return the list of member names inside the archive.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

abstractmethod asyncopen_member(member_name: str)→ Any[source]
Open and return a single archive member by name.

asyncstream(chunk_size: int | None = None)→ AsyncGenerator[Any, None][source]
Yield each archive member as it is opened.

classpysus.api.models.BaseFile(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)])[source]
Bases: BaseModel, ABC

Abstract base for a single file, local or remote.

Subclasses must implement name, extension, size, and modify.

propertybasename: str
Return the file name from the path.

abstract propertyextension: str
Return the file extension string.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

abstract propertymodify: datetime
Return the last modification timestamp.

abstract propertyname: str
Return the display name of the file.

path: Path
abstract propertysize: int
Return the file size in bytes.

type: str | FileType
classpysus.api.models.BaseLocalFile(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)])[source]
Bases: BaseFile, ABC

Abstract base for a file stored on the local filesystem.

Subclasses must implement load and stream.

propertyextension: str
Return the file extension from the local path.

asyncget_hash(algorithm: str = 'sha256', chunk_size: int = 1048576)→ str[source]
Compute the file’s hash digest.

Parameters
:
algorithm (str, optional) – The hash algorithm name (default "sha256").

chunk_size (int, optional) – Read chunk size in bytes (default 1 MiB).

Returns
:
The hex digest string.

Return type
:
str

abstractmethod asyncload()→ Any[source]
Load the entire file content into memory and return it.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

propertymodify: datetime
Return the last modification timestamp from the local filesystem.

propertyname: str
Return the file name from the path.

path: Path
propertysize: int
Return the file size in bytes from the local filesystem.

abstractmethodstream(chunk_size: int = 10000)→ AsyncGenerator[Any, None][source]
Yield chunks of the file content as an async generator.

classpysus.api.models.BaseRemoteClient[source]
Bases: BaseRemoteObject, ABC

Abstract base for a remote API client (e.g. FTP, HTTP).

Subclasses must implement connect, close, login, datasets, and \_download_file.

abstractmethod asyncclose()→ None[source]
Close the connection to the remote server.

abstractmethod asyncconnect()→ None[source]
Establish a connection to the remote server.

abstractmethod asyncdatasets(\*\*kwargs)→ list[source]
Return a list of available datasets matching kwargs.

abstractmethod asyncdownload(file: BaseRemoteFile, output: Path, callback: Callable[[int, int], None] | None = None)→ Path[source]
Download a single file to output and return the local path.

abstractmethod asynclogin(\*\*kwargs)→ None[source]
Authenticate with the remote server using kwargs credentials.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

classpysus.api.models.BaseRemoteDataset[source]
Bases: BaseRemoteObject, SearchableMixin, ABC

Abstract base for a dataset containing groups and/or files.

Subclasses must implement \_fetch_content.

client: BaseRemoteClient
propertycontent: Sequence[BaseRemoteGroup | BaseRemoteFile]
Return the dataset content, fetching on first access.

group_definitions: dict[str, str]
model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

asyncsearch(\*\*kwargs)→ list[BaseRemoteFile][source]
Recursively search groups and files by attribute kwargs.

Return matching file objects.

classpysus.api.models.BaseRemoteFile(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)])[source]
Bases: BaseFile, SearchableMixin, ABC

Abstract base for a file stored on a remote server.

Subclasses must implement \_download. dataset and group link back to the containing objects.

propertyclient: BaseRemoteClient
Return the remote client associated with this file.

dataset: BaseRemoteDataset
asyncdownload(output: str | Path | None = None, callback: Callable[[int, int], None] | None = None)→ BaseLocalFile[source]
Download the remote file to a local cache or output path.

Return the instantiated local file wrapper.

group: BaseRemoteGroup | None
model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

propertymonth: int | None
Return the month associated with the file, or None.

propertyname: str
Return the basename as the display name.

propertystate: Annotated[str, AfterValidator(func=_validate_state)] | None
Return the state associated with the file, or None.

propertyyear: int | None
Return the year associated with the file, or None.

classpysus.api.models.BaseRemoteGroup[source]
Bases: BaseRemoteObject, SearchableMixin, ABC

Abstract base for a named group of remote files within a dataset.

Subclasses must implement \_fetch_files.

dataset: BaseRemoteDataset
propertyfiles: list[BaseRemoteFile]
Return all files in this group, fetching them on first access.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyparent: BaseRemoteDataset
Return the parent dataset.

asyncsearch(\*\*kwargs)→ list[BaseRemoteFile][source]
Filter files in this group by attribute kwargs.

Return matching file objects.

classpysus.api.models.BaseRemoteObject[source]
Bases: BaseModel, ABC

Abstract base for a named remote entity with a description.

Subclasses must implement name, long_name, and description.

abstract propertydescription: str
Return a textual description of the entity.

abstract propertylong_name: str
Return the long / human-readable name.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

abstract propertyname: str
Return the short name of the remote entity.

classpysus.api.models.BaseTabularFile(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)])[source]
Bases: BaseLocalFile, ABC

Abstract base for a local tabular file (e.g. CSV, Parquet).

Subclasses must implement columns, rows, load, and stream.

abstract propertycolumns: list[Column]
Return the list of column metadata.

abstractmethod asyncload()→ DataFrame[source]
Load the entire file into a pandas DataFrame.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

abstract propertyrows: int
Return the number of data rows.

abstractmethodstream(chunk_size: int = 10000)→ AsyncGenerator[DataFrame, None][source]
Yield pandas DataFrames in chunks as an async generator.

asyncto_parquet(output_path: str | Path | None = None, chunk_size: int = 10000, callback: Callable[[int, int], None] | None = None)→ Parquet[source]
Convert the file to Parquet format.

Parameters
:
output_path (str or Path, optional) – Destination path for the Parquet file. Defaults to the source path with a .parquet extension.

chunk_size (int, optional) – Number of rows per streaming chunk (default 10 000).

callback (Callable[[int, int], None], optional) – Function called after each chunk with (current_rows, total_rows).

Returns
:
The resulting Parquet wrapper object.

Return type
:
Parquet

classpysus.api.models.SearchableMixin[source]
Bases: object

Mixin providing attribute-based filtering for remote objects.

High-Level Data Functions
High-level convenience functions for fetching Brazilian health data.

Each function wraps an asynchronous query/download pipeline and returns a pandas DataFrame. The available datasets cover disease notification (SINAN), vital statistics (SINASC, SIM), hospital admissions (SIH), ambulatory care (SIA), immunisation (PNI), census data (IBGE), health facilities (CNES), and hospitalisation records (CIHA).

pysus.api.\_impl.databases.ciha(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], month: int | list[int], group: str | None = 'CIHA', \*\*kwargs)→ list[str] | DataFrame[source]
Fetch CIHA hospitalisation records for state, year, month, and group.

CIHA (Comunicação de Internação Hospitalar) provides hospitalisation records.

Parameters
:
state (State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

month (int | list[int]) – Month or list of months to fetch.

group (str, optional) – Additional grouping code. Default is “CIHA”.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.cnes(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], month: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch CNES health facilities for a state, year, month, and group.

CNES (Cadastro Nacional de Estabelecimentos de Saúde) is the Brazilian registry of health-care facilities.

Parameters
:
state (State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

month (int | list[int]) – Month or list of months to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.ibge(year: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch IBGE census data for given year(s) and optional group.

IBGE (Instituto Brasileiro de Geografia e Estatística) provides census and demographic data.

Parameters
:
year (int | list[int]) – Year or list of years to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.list_files(dataset: Annotated[str, AfterValidator(func=_validate_dataset_name)], client: Annotated[str, AfterValidator(func=_validate_origin)] | None = None, group: str | None = None, state: str | None = None, year: int | list[int] | None = None, month: int | list[int] | None = None, \*\*kwargs)→ DataFrame[source]
List catalog files filtered by client, group, state, year, and month.

Queries the PySUS API metadata and returns a DataFrame with file data without downloading the actual files.

Parameters
:
dataset (Literal) – Dataset name (e.g. “SINAN”, “SINASC”, etc.).

client (Origin, optional) – Data source client to query.

group (str, optional) – Group or disease code to filter by.

state (str, optional) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int], optional) – Year or list of years to filter by.

month (int | list[int], optional) – Month or list of months to filter by.

\*\*kwargs – Additional arguments forwarded to PySUS.query().

Returns
:
DataFrame with columns name, path, dataset, group, year, month, state, and modify.

Return type
:
pd.DataFrame

pysus.api.\_impl.databases.pni(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch PNI immunisation records for a given state, year(s), and group.

PNI (Programa Nacional de Imunizações) is the Brazilian national immunisation programme.

Parameters
:
state (State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.sia(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], month: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch SIA ambulatory care for a state, year, month, and group.

SIA (Sistema de Informação Ambulatorial) is the Brazilian ambulatory care information system.

Parameters
:
state (types.State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

month (int | list[int]) – Month or list of months to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.sih(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], month: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch SIH hospital admissions for a state, year, month, and group.

SIH (Sistema de Informação Hospitalar) is the Brazilian hospital admission information system.

Parameters
:
state (types.State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

month (int | list[int]) – Month or list of months to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.sim(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch SIM mortality records for a given state, year(s), and group.

SIM (Sistema de Informação sobre Mortalidade) is the Brazilian mortality information system.

Parameters
:
state (State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.sinan(disease: Literal['ACBI', 'ACGR', 'ANIM', 'ANTR', 'BOTU', 'CANC', 'CHAG', 'CHIK', 'COLE', 'COQU', 'DENG', 'DERM', 'DIFT', 'ESQU', 'EXAN', 'FMAC', 'FTIF', 'HANS', 'HANT', 'HEPA', 'IEXO', 'INFL', 'LEIV', 'LEPT', 'LERD', 'LTAN', 'MALA', 'MENI', 'MENT', 'NTRA', 'PAIR', 'PEST', 'PFAN', 'PNEU', 'RAIV', 'SDTA', 'SIFA', 'SIFC', 'SIFG', 'SRC', 'TETA', 'TETN', 'TOXC', 'TOXG', 'TRAC', 'TUBE', 'VARC', 'VIOL', 'ZIKA'], year: int | list[int], \*\*kwargs)→ list[str] | DataFrame[source]
Fetch SINAN records for a given disease and year(s).

SINAN (Sistema de Informação de Agravos de Notificação) is the Brazilian notifiable-disease information system.

Parameters
:
disease (Literal) – Disease code (e.g. “DENG” for dengue, “ZIKA” for zika).

year (int | list[int]) – Year or list of years to fetch.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

pysus.api.\_impl.databases.sinasc(state: Annotated[str, AfterValidator(func=_validate_state)], year: int | list[int], group: str | None = None, \*\*kwargs)→ list[str] | DataFrame[source]
Fetch SINASC birth certificates for a given state, year(s), and group.

SINASC (Sistema de Informação sobre Nascidos Vivo) is the Brazilian live birth information system.

Parameters
:
state (types.State) – Two-letter state abbreviation (e.g. “RJ”).

year (int | list[int]) – Year or list of years to fetch.

group (str, optional) – Additional grouping code.

\*\*kwargs – Additional arguments forwarded to \_fetch_data().

Returns
:
List of downloaded Parquet paths, or a DataFrame if specified.

Return type
:
list[str] | pd.DataFrame

DuckLake Client
High-level client for DuckLake S3-based public health dataset catalog.

Provides authentication, dataset discovery, and file download capabilities backed by per-dataset DuckDB engines.

classpysus.api.ducklake.client.DuckLake(engine=None, columns_engine=None, update_on_close: bool = False, \*, credentials: DuckLakeCredentials | None = None)[source]
Bases: BaseRemoteClient

propertycatalog_path: Path
asyncclose(update_catalog: bool | None = None)→ None[source]
Close the connection to the remote server.

propertycolumns_path: Path
asyncconnect(force: bool = False, callback: Callable[[int, int], None] | None = None)→ None[source]
Establish a connection to the remote server.

credentials: DuckLakeCredentials | None
asyncdatasets(\*\*kwargs)→ list[DuckDataset][source]
Return a list of available datasets matching kwargs.

propertydescription: str
Return a textual description of the entity.

asyncdownload(file: BaseRemoteFile, output: Path, callback: Callable[[int, int], None] | None = None)→ Path[source]
Download a single file to output and return the local path.

asynclogin(\*\*kwargs)→ None[source]
Authenticate with the remote server using kwargs credentials.

propertylong_name: str
Return the long / human-readable name.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name of the remote entity.

update_on_close: bool
Application-level models for DuckLake remote resources.

Wraps catalog ORM records into BaseRemoteFile, BaseRemoteDataset, and BaseRemoteGroup interfaces used by the rest of PySUS.

classpysus.api.ducklake.models.DuckDataset(\*, client: DuckLake, group_definitions: dict[str, str] = {}, record: Dataset, border: Any, update_on_close: bool = False)[source]
Bases: BaseRemoteDataset

propertyadapter: DatasetAdapter
border: Any
client: DuckLake
asyncclose(update_catalog: bool | None = None)[source]
asyncconnect(force: bool = False)→ None[source]
propertydescription: str
Return a textual description of the entity.

propertyid: int

propertylong_name: str
Return the long / human-readable name.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name of the remote entity.

asyncquery(group: str | list[str] | None = None, state: str | list[str] | None = None, year: int | list[int] | range | None = None, month: int | list[int] | range | None = None)→ list[File][source]
record: Dataset
update_on_close: bool
classpysus.api.ducklake.models.DuckGroup(\*, dataset: BaseRemoteDataset)[source]
Bases: BaseRemoteGroup

dataset: DuckDataset
propertydescription: str
Return a textual description of the entity.

propertylong_name: str
Return the long / human-readable name.

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name of the remote entity.

record: Group
classpysus.api.ducklake.models.File(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)], dataset: BaseRemoteDataset, group: BaseRemoteGroup | None = None)[source]
Bases: BaseRemoteFile

propertybasename: str
Return the file name from the path.

propertyextension: str
Return the file extension string.

group: DuckGroup | None
model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertymodify: datetime
Return the last modification timestamp.

propertyrecord: File

propertyrows: int

propertysha256: str | None

propertysize: int
Return the file size in bytes.

asyncverify(path: Path)→ bool[source]
FTP Client
Async FTP client wrapping the standard ftplib for DATASUS data access.

classpysus.api.ftp.client.FTP(\*, host: str = 'ftp.datasus.gov.br', timeout: int = 60)[source]
Bases: BaseRemoteClient

Async FTP client for navigating and downloading DATASUS data.

asyncclose()→ None[source]
Close the FTP connection and reset the internal client state.

Raises
:
Exception – Any exception raised by ftplib during disconnection.

asyncconnect()→ None[source]
Establish the FTP connection to the remote host.

Raises
:
Exception – Any exception raised by ftplib during connection.

asyncdatasets(\*\*kwargs)→ list[Dataset][source]
Return a list of all available dataset instances for this client.

Returns
:
A list of Dataset instances for all available databases.

Return type
:
list[Dataset]

Raises
:
ConnectionError – If the FTP client is not connected.

propertydescription: str
Return a description of this client’s purpose.

Returns
:
A description string explaining the FTP client’s capabilities.

Return type
:
str

asyncdownload(file: BaseRemoteFile, output: Path, callback: Callable[[...], None] | None = None)→ Path[source]
Download a remote file locally, optionally reporting progress.

propertyftp: FTP | None
Return the underlying ftplib.FTP, or None if not connected.

Returns
:
The ftplib.FTP instance, or None if not connected.

Return type
:
FTPLib | None

host: str
asynclogin(\*\*kwargs)→ None[source]
Authenticate and connect to the FTP server (alias for connect).

Parameters
:
\*\*kwargs – Forwarded to connect() (currently unused).

Raises
:
Exception – Any exception raised by ftplib during authentication.

propertylong_name: str
Return the human-readable name of this client.

Returns
:
The human-readable client name.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name of this client.

Returns
:
The client short name (“FTP”).

Return type
:
str

timeout: int
classpysus.api.ftp.client.FTPFileInfo[source]
Bases: TypedDict

Parsed metadata for a file or directory entry from an FTP listing.

group: FTPGroupInfo | None
modify: datetime
month: int | None
name: str
size: int
state: State | None
type: str
year: int | None
classpysus.api.ftp.client.FTPGroupInfo[source]
Bases: TypedDict

Metadata describing a file group within a dataset.

description: str | None
long_name: str | None
name: str
DATASUS FTP dataset definitions with filename parsers for each database.

classpysus.api.ftp.databases.CIHA(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Comunicação de Internação Hospitalar e Ambulatorial (CIHA).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a CIHA filename into group, state, year and month metadata.

Parameters
:
filename (str) – The raw CIHA filename to parse.

Returns
:
A dict with keys group, state, year, month. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.CNES(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Cadastro Nacional de Estabelecimentos de Saúde (CNES).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a CNES filename into group, state, year and month metadata.

Parameters
:
filename (str) – The raw CNES filename to parse.

Returns
:
A dict with keys group, state, year, month. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.IBGEDATASUS(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

População Residente e Projeções (IBGE).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse an IBGE filename into group and year metadata.

Parameters
:
filename (str) – The raw IBGE filename to parse.

Returns
:
A dict with keys group, year. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.PNI(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Programa Nacional de Imunizações (PNI).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a PNI filename into group, state and year metadata.

Parameters
:
filename (str) – The raw PNI filename to parse.

Returns
:
A dict with keys group, state, year. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.SIA(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informações Ambulatoriais — outpatient information system.

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse an SIA filename into group, state, year and month metadata.

Parameters
:
filename (str) – The raw SIA filename to parse.

Returns
:
A dict with keys group, state, year, month. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.SIH(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informações Hospitalares (SIH).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse an SIH filename into group, state, year and month metadata.

Parameters
:
filename (str) – The raw SIH filename to parse.

Returns
:
A dict with keys group, state, year, month. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.SIM(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informação sobre Mortalidade (SIM).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SIM filename into group, state and year metadata.

Parameters
:
filename (str) – The raw SIM filename to parse.

Returns
:
A dict with keys group, state, year. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.SINAN(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informação de Agravos de Notificação (SINAN).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SINAN filename into group and year metadata.

Parameters
:
filename (str) – The raw SINAN filename to parse.

Returns
:
A dict with keys group, year. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.databases.SINASC(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informações sobre Nascidos Vivos (SINASC).

propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose in Portuguese.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SINASC filename into group, state and year metadata.

Parameters
:
filename (str) – The raw SINASC filename to parse.

Returns
:
A dict with keys group, state, year. On parse failure values are set to None.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym (e.g. “CIHA”).

Return type
:
str

paths: list[Directory]
Data model classes for FTP directories, files, groups and datasets.

classpysus.api.ftp.models.Dataset(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: BaseRemoteDataset, ABC

Abstract base for a DATASUS dataset, providing file discovery via FTP.

abstract propertydescription: str
Return a description of the dataset’s purpose.

Returns
:
A description of the dataset’s purpose.

Return type
:
str

abstractmethodformatter(filename: str)→ dict[str, Any][source]
Parse a filename into metadata (group, state, year, etc.).

Parameters
:
filename (str) – The raw filename to parse.

Returns
:
A dictionary of parsed metadata fields.

Return type
:
dict[str, Any]

group_definitions: dict[str, str]
abstract propertylong_name: str
Return the dataset full name in Portuguese.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

abstract propertyname: str
Return the dataset short name.

Returns
:
The dataset acronym.

Return type
:
str

paths: list[Directory]
classpysus.api.ftp.models.Directory(path: str, parent: Directory | Dataset | Group | None = None, client: BaseRemoteClient | None = None, formatter: Callable | None = None, dataset: Dataset | None = None)[source]
Bases: object

A remote FTP directory lazily loaded into files and subdirectories.

propertycontent: list[Directory | File]
Return the directory contents, loading from FTP if not yet cached.

Returns
:
The list of files and subdirectories.

Return type
:
list[Directory | File]

asyncload()→ None[source]
Fetch and parse the directory listing from the FTP server.

Raises
:
ValueError – If the client is not an FTP instance.

classpysus.api.ftp.models.File(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)], dataset: BaseRemoteDataset, group: BaseRemoteGroup | None = None)[source]
Bases: BaseRemoteFile

A single file on the DATASUS FTP server with parsed metadata.

propertyextension: str
Return the file extension (e.g. .dbc, .dbf).

Returns
:
The file extension including the leading dot.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertymodify: datetime
Return the last modification timestamp.

Returns
:
The file’s last modification datetime.

Return type
:
datetime

Raises
:
ValueError – If no modification date is available.

propertymonth: int | None
Return the data month extracted from the filename, if available.

Returns
:
The month as an integer, or None if not available.

Return type
:
int | None

propertysize: int
Return the file size in bytes.

Returns
:
The file size in bytes.

Return type
:
int

propertystate: Annotated[str, AfterValidator(func=_validate_state)] | None
Return the state code extracted from the filename, if available.

Returns
:
The state code, or None if not available.

Return type
:
State | None

propertyyear: int | None
Return the data year extracted from the filename, if available.

Returns
:
The year as an integer, or None if not available.

Return type
:
int | None

classpysus.api.ftp.models.Group(\*, dataset: BaseRemoteDataset)[source]
Bases: BaseRemoteGroup

A group of related files within a dataset (e.g. all files of a type).

propertycontent: list[Directory | File]
Return the contents of the underlying directory.

Returns
:
The directory contents.

Return type
:
list[Directory | File]

propertydescription: str
Return the group description.

Returns
:
The group description.

Return type
:
str

propertylong_name: str
Return the human-readable group name.

Returns
:
The human-readable group name.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the group short code (e.g. ‘RD’, ‘PA’).

Returns
:
The group short code.

Return type
:
str

path: str
DadosGov Client
HTTP client and data models for the dados.gov.br API.

classpysus.api.dadosgov.client.ConjuntoDados(\*, client: ~pysus.api.models.BaseRemoteClient | None = None, id: str, titulo: str, nome: str, recursos: list[~pysus.api.dadosgov.client.Recurso] = <factory>)[source]
Bases: BaseModel

A dataset group as returned by the dados.gov.br API.

client: BaseRemoteClient | None
id: str
model_config: ClassVar[ConfigDict]= {'populate_by_name': True, 'validate_by_alias': True, 'validate_by_name': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

resources: list[Recurso]
slug: str
title: str
classpysus.api.dadosgov.client.DadosGov(\*, base_url: str = 'https://dados.gov.br/dados/api')[source]
Bases: BaseRemoteClient

Client for the dados.gov.br open data portal API.

base_url: str
asyncclose()→ None[source]
Close the underlying HTTP client and release resources.

asyncconnect(token: str | None = None)→ None[source]
Connect to the dados.gov.br API with the given token.

Parameters
:
token (str, optional) – The API authentication token. If not provided, uses the previously stored token.

Raises
:
ValueError – If no token is provided and none was previously stored.

asyncdatasets(\*\*kwargs)→ list[Dataset][source]
Return a list of pre-configured health datasets.

Returns
:
A list of available Dataset instances for known health databases.

Return type
:
list[Dataset]

propertydescription: str
Return a description of the client.

Returns
:
A Portuguese description of the API interface.

Return type
:
str

asyncdownload(file: BaseRemoteFile, output: Path, callback: Callable[[int, int], None] | None = None)→ Path[source]
Download a remote file to a local path.

asyncget_dataset(id: str)→ ConjuntoDados[source]
Fetch a single dataset by its ID.

Parameters
:
id (str) – The unique identifier of the dataset.

Returns
:
The requested dataset.

Return type
:
ConjuntoDados

Raises
:
ConnectionError – If the client is not connected.

asynclist_datasets(\*\*kwargs)→ list[ConjuntoDados][source]
Search and list available datasets from the portal.

Parameters
:
\*\*kwargs –

Search parameters. Supported keys:

pagina (int): Page number for pagination.

nome_conjunto (str): Filter by dataset name.

dados_abertos (bool): Filter by open data flag.

is_privado (bool): Filter by private datasets.

id_organizacao (str): Filter by organisation ID.

Returns
:
A list of datasets matching the search criteria.

Return type
:
list[ConjuntoDados]

Raises
:
ConnectionError – If the client is not connected.

asynclogin(token: str | None = None, \*\*kwargs)→ None[source]
Authenticate with the API.

Delegates to the connect() method.

Parameters
:
token (str, optional) – The API authentication token.

\*\*kwargs – Additional keyword arguments (currently unused).

propertylong_name: str
Return the human-readable client name.

Returns
:
The full Portuguese name of the portal.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short client name.

Returns
:
The abbreviated client name "DadosGov".

Return type
:
str

classpysus.api.dadosgov.client.Recurso(\*, id: str, titulo: str, link: str, tamanho: int, dataUltimaAtualizacaoArquivo: Annotated[datetime | None, BeforeValidator(func=to_datetime, json_schema_input_type=PydanticUndefined)] = None, nomeArquivo: str | None = None)[source]
Bases: BaseModel

A single resource (file) within a dataset on dados.gov.br.

api_size: int
file_name: str | None
asyncget_size()→ int[source]
Retrieve the file size from the remote server.

Makes a HEAD request (falling back to GET with a Range header) to determine the Content-Length of the resource.

Returns
:
The file size in bytes, or 0 if the size could not be determined.

Return type
:
int

id: str
last_modified: DateTime
model_config: ClassVar[ConfigDict]= {'populate_by_name': True, 'validate_by_alias': True, 'validate_by_name': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

title: str
url: str
pysus.api.dadosgov.client.to_bool(value: Any)→ bool[source]
Parse a Brazilian Portuguese boolean value into a bool.

Parameters
:
value (Any) – The value to parse (e.g., "sim", "não", True, False).

Returns
:
True if the value represents an affirmative, False otherwise.

Return type
:
bool

pysus.api.dadosgov.client.to_datetime(value: Any)→ datetime | None[source]
Parse a Brazilian date string into a datetime object.

Parameters
:
value (Any) – The value to parse, expected to be a date string in Brazilian format (e.g., %d/%m/%Y %H:%M:%S or %d/%m/%Y).

Returns
:
Parsed datetime object, or None if the value cannot be parsed.

Return type
:
datetime or None

Pre-configured health database definitions accessible via dados.gov.br.

classpysus.api.dadosgov.databases.CNES(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Cadastro Nacional de Estabelecimentos de Saúde (CNES).

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the CNES information system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a CNES filename and extract metadata.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "CNES".

Return type
:
str

classpysus.api.dadosgov.databases.COVID19(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Casos Confirmados de COVID-19.

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the COVID-19 confirmed cases dataset.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a COVID-19 filename and extract metadata.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "COVID19".

Return type
:
str

classpysus.api.dadosgov.databases.PNI(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Programa Nacional de Imunizações (PNI).

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the PNI vaccination monitoring system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a PNI vaccination filename into month and year.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

group_aliases: dict[str, str]
ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "PNI".

Return type
:
str

classpysus.api.dadosgov.databases.SIA(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informações Ambulatoriais (SIA).

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the SIA outpatient information system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse an SIA filename into year.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "SIA".

Return type
:
str

classpysus.api.dadosgov.databases.SIM(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informação sobre Mortalidade (SIM).

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the SIM mortality information system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SIM filename into year.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

group_aliases: dict[str, str]
ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "SIM".

Return type
:
str

classpysus.api.dadosgov.databases.SINAN(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informação de Agravos de Notificação (SINAN).

propertydescription: str
Return a description of the dataset.

Returns
:
A Portuguese description of the SINAN notifiable diseases system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SINAN filename into state and year.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

group_aliases: dict[str, str]
ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "SINAN".

Return type
:
str

classpysus.api.dadosgov.databases.SINASC(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: Dataset

Sistema de Informações sobre Nascidos Vivos (SINASC).

propertydescription: str
Return a description of the dataset.

Returns
:
Portuguese description of the SINASC live birth system.

Return type
:
str

formatter(filename: str)→ dict[str, Any][source]
Parse a SINASC filename into year.

Parameters
:
filename (str) – The name of the file to parse.

Returns
:
A dictionary with keys state, year, and month. Unrecognised files return None for all keys.

Return type
:
dict[str, Any]

group_aliases: dict[str, str]
ids: list[str]
propertylong_name: str
Return the human-readable name.

Returns
:
The full Portuguese name of the dataset.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the short name.

Returns
:
The abbreviated dataset name "SINASC".

Return type
:
str

Internal domain models for datasets, groups, and files from dados.gov.br.

classpysus.api.dadosgov.models.Dataset(\*, client: BaseRemoteClient, group_definitions: dict[str, str] = {})[source]
Bases: BaseRemoteDataset

A health dataset available through dados.gov.br.

Subclasses define a list of API dataset IDs and an optional formatter() that extracts metadata from file names.

client: DadosGov
abstractmethodformatter(filename: str)→ dict[str, Any][source]
Extract structured metadata from a filename.

group_aliases: dict[str, str]
ids: list[str]
model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

classpysus.api.dadosgov.models.File(\*, path: Path, type: str | Annotated[str, AfterValidator(func=_validate_file_type)], dataset: BaseRemoteDataset, group: BaseRemoteGroup | None = None)[source]
Bases: BaseRemoteFile

A downloadable file from a dados.gov.br dataset.

propertyextension: str
Return the file extension.

Returns
:
The file extension (e.g., ".csv", ".zip").

Return type
:
str

asyncfetch_metadata()→ None[source]
Fetch file size and last-modified from the remote server.

Updates record.api_size and record.last_modified in-place. Silently ignores connection errors.

asyncfetch_size()→ int[source]
Fetch the remote file size and update the local record.

Makes a HEAD request (falling back to GET with a Range header) to determine the Content-Length.

Returns
:
The file size in bytes, or 0 if the size could not be determined.

Return type
:
int

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True, 'validate_assignment': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(\_File\_\_context: Any)→ None[source]
Fetch remote metadata if size or modify date is missing.

If both api_size and last_modified are falsy, schedules a background task to fetch metadata from the remote server.

Parameters
:
\_\_context (Any) – Pydantic validation context (unused).

propertymodify: datetime
Return the last modification date.

Returns
:
The last modification datetime.

Return type
:
datetime

Raises
:
ValueError – If the modification date has not been set.

propertymonth: int | None
Return the inferred month from metadata.

Returns
:
The month if present in metadata, otherwise None.

Return type
:
int or None

record: Recurso
propertysize: int
Return the file size in bytes.

Returns
:
The file size, or 0 if unknown.

Return type
:
int

propertystate: Annotated[str, AfterValidator(func=_validate_state)] | None
Return the inferred state from metadata.

Returns
:
The state abbreviation if present in metadata, otherwise None.

Return type
:
State or None

type: str
propertyyear: int | None
Return the inferred year from metadata.

Returns
:
The year if present in metadata, otherwise None.

Return type
:
int or None

classpysus.api.dadosgov.models.Group(\*, dataset: BaseRemoteDataset)[source]
Bases: BaseRemoteGroup

A group of files within a dataset.

propertydescription: str
Return an empty description for the group.

Returns
:
An empty string.

Return type
:
str

propertylong_name: str
Return the group title.

Returns
:
The title of the underlying API record.

Return type
:
str

model_config: ClassVar[ConfigDict]= {'arbitrary_types_allowed': True}
Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

model_post_init(context: Any, /)→ None
This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

Parameters
:
self – The BaseModel instance.

context – The context.

propertyname: str
Return the group name, resolved through dataset aliases.

Returns
:
The alias for the group slug if defined, otherwise the raw slug.

Return type
:
str

record: ConjuntoDados
