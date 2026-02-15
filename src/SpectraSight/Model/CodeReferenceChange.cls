Class SpectraSight.Model.CodeReferenceChange Extends SpectraSight.Model.Activity
{

Property ClassName As %String(%JSONFIELDNAME = "className", MAXLEN = 500);

Property MethodName As %String(%JSONFIELDNAME = "methodName", MAXLEN = 255);

Property Action As %String(%JSONFIELDNAME = "action", VALUELIST = ",added,removed");

Storage Default
{
<Data name="CodeReferenceChangeDefaultData">
<Subscript>"CodeReferenceChange"</Subscript>
<Value name="1">
<Value>ClassName</Value>
</Value>
<Value name="2">
<Value>MethodName</Value>
</Value>
<Value name="3">
<Value>Action</Value>
</Value>
</Data>
<DefaultData>CodeReferenceChangeDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
